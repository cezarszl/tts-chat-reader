import { exec, execSync, spawn, ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { broadcastMessage } from "../ws";
import { speakText } from "../tts";
import { SessionMessage } from "../types/SessionMessage";
import { LinkState } from "../types/LinkState";
import { MESSAGES_DIR, UPLOADS_DIR, SIGNAL_CONFIG_DIR } from "../config/paths";


const SIGNAL_CLI_PATH = process.env.SIGNAL_CLI_PATH ?? "signal-cli";
const CONFIG_DIR = SIGNAL_CONFIG_DIR;

const historyPath = path.join(MESSAGES_DIR, "signal-history.json");
const namesPath = path.join(MESSAGES_DIR, "signal-names.json");

export const MY_NUMBER = process.env.SIGNAL_PHONE_NUMBER!;
export const sessionMessages: Record<string, SessionMessage[]> = {};
export let knownNames: Record<string, string> = {};

const state: LinkState = {
    child: undefined,
    qrDataUrl: null,
    startedAt: undefined,
    completed: false,
    timeout: undefined,
};

let daemonProcess: ChildProcessWithoutNullStreams | null = null;
let restartTimer: NodeJS.Timeout | undefined;
let isExplicitStop = false;
let daemonStartTime = 0;

function hardKillSignalCli() {
    try {
        execSync("pkill -9 -f signal-cli || true");
    } catch { }
}

async function stopDaemon(): Promise<void> {
    console.log("🛑 Stopping Signal daemon...");

    if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = undefined;
    }

    if (daemonProcess) {
        daemonProcess.removeAllListeners("close");
        isExplicitStop = true;
        daemonProcess.kill("SIGKILL");
        daemonProcess = null;
        await new Promise((r) => setTimeout(r, 500));
    }

    hardKillSignalCli();
    await new Promise((r) => setTimeout(r, 500));
}

export function startSignalDaemon(): void {
    if (daemonProcess) {
        console.log("⚠️ Signal daemon is already running.");
        return;
    }

    if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = undefined;
    }

    isExplicitStop = false;
    daemonStartTime = Date.now();

    console.log("🚀 Starting Signal daemon...");

    daemonProcess = spawn(
        SIGNAL_CLI_PATH,
        ["--config", CONFIG_DIR, "--output=json", "daemon", "--dbus"],
        { env: process.env }
    );

    let buffer = "";

    daemonProcess.stdout.on("data", async (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const jsonMsg = JSON.parse(line);
                await processSignalEnvelope(jsonMsg);
            } catch { }
        }
    });

    daemonProcess.stderr.on("data", (data) => {
        const log = data.toString();
        if (log.toLowerCase().includes("error") || log.includes("Exception")) {
            console.error("[Signal Daemon STDERR]:", log.trim());
        }
    });

    daemonProcess.on("close", (code) => {
        daemonProcess = null;

        if (isExplicitStop) {
            console.log("🛑 Signal daemon stopped explicitly (no restart).");
            return;
        }

        console.log(`💀 Signal daemon exited with code ${code}. Restarting in 5s...`);
        restartTimer = setTimeout(() => {
            restartTimer = undefined;
            startSignalDaemon();
        }, 5000);
    });
}

function buildListDevicesCommand(): string {
    if (daemonProcess) {
        return `${SIGNAL_CLI_PATH} --dbus --config ${CONFIG_DIR} -a ${MY_NUMBER} listDevices`;
    }
    return `${SIGNAL_CLI_PATH} --config ${CONFIG_DIR} -a ${MY_NUMBER} listDevices`;
}

function isTransientVerifyError(raw: string): boolean {
    const s = raw || "";

    if (
        s.includes("The name org.asamk.Signal was not provided by any .service files") ||
        s.includes("org.freedesktop.DBus.Error.ServiceUnknown") ||
        s.includes("signal-cli DBus daemon not running")
    ) {
        return true;
    }

    if (
        s.includes("Config file is in use by another instance") ||
        s.toLowerCase().includes("config file is in use") ||
        s.toLowerCase().includes("waiting")
    ) {
        return true;
    }

    return false;
}

function cleanJavaToolOptions(stderr: string): string {
    return (stderr || "")
        .split("\n")
        .filter((l) => !l.includes("JAVA_TOOL_OPTIONS"))
        .join("\n")
        .trim();
}

export const verifySignalSession = async (): Promise<boolean> => {
    const filesExist = await isSignalLinked();
    if (!filesExist) return false;

    if (daemonProcess && Date.now() - daemonStartTime < 5000) return true;

    return new Promise((resolve) => {
        const cmd = buildListDevicesCommand();

        exec(cmd, { env: process.env }, (error, _stdout, stderr) => {
            if (!error) return resolve(true);

            const raw = (stderr || "").toString();

            if (isTransientVerifyError(raw)) {
                console.warn("⏳ Transient signal-cli/DBus state. Treating as VALID for now.");
                return resolve(true);
            }

            const cleaned = cleanJavaToolOptions(raw);
            console.warn("⚠️ Session verification failed:", (cleaned || raw).split("\n")[0]);
            return resolve(false);
        });
    });
};

export const removeSession = async (): Promise<void> => {
    console.log("🧨 Removing Signal session...");

    await stopDaemon();

    try {
        if (fs.existsSync(CONFIG_DIR)) {
            const files = fs.readdirSync(CONFIG_DIR);
            for (const file of files) {
                const curPath = path.join(CONFIG_DIR, file);
                fs.rmSync(curPath, { recursive: true, force: true });
            }
            console.log("🗑️ Configuration files cleared.");
        }
    } catch (e) {
        console.error("❌ Error clearing session files:", e);
    }

    console.log("✅ Session reset complete.");
};

export function startSignalLink(deviceName = "MyChatReader", timeoutMs = 3 * 60 * 1000): void {
    if (state.child && !state.completed) return;

    cancelSignalLink();

    const child = spawn(SIGNAL_CLI_PATH, ["--config", CONFIG_DIR, "link", "-n", deviceName]);
    state.child = child;
    state.startedAt = Date.now();
    state.completed = false;

    let buffer = "";

    child.stdout.on("data", async (chunk) => {
        buffer += chunk.toString();
        const nl = buffer.indexOf("\n");

        if (nl !== -1 && !state.qrDataUrl) {
            const firstLine = buffer.slice(0, nl).trim();
            if (firstLine.startsWith("sgnl://")) {
                state.qrDataUrl = await QRCode.toDataURL(firstLine, { width: 360, margin: 1 });
                state.timeout = setTimeout(() => cancelSignalLink(), timeoutMs);
            }
        }
    });

    child.on("close", async () => {
        if (state.timeout) clearTimeout(state.timeout);

        const linked = await isSignalLinked();

        if (linked) {
            console.log("✅ Linking successful! Restarting daemon...");
            state.completed = true;
            state.qrDataUrl = null;

            await stopDaemon();
            console.log("🔄 Starting fresh daemon...");
            startSignalDaemon();
        } else {
            console.log("❌ Linking failed or timed out.");
            state.completed = false;
        }

        state.child = undefined;
        state.startedAt = undefined;
        state.timeout = undefined;
    });
}

export function getSignalQrBase64(): string | null {
    return state.qrDataUrl ?? null;
}

export function isLinkingInProgress(): boolean {
    return !!state.child && !state.completed;
}

export function cancelSignalLink(): void {
    if (state.timeout) clearTimeout(state.timeout);
    state.timeout = undefined;
    try {
        state.child?.kill("SIGINT");
    } catch { }
    state.child = undefined;
    state.qrDataUrl = null;
    state.startedAt = undefined;
    state.completed = false;
}

function loadJsonFile<T>(filePath: string): T | null {
    try {
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
    } catch {
        return null;
    }
}

function saveJsonFile(filePath: string, data: unknown): void {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch { }
}

const loadedHistory = loadJsonFile<Record<string, SessionMessage[]>>(historyPath);
if (loadedHistory) {
    for (const contact in loadedHistory) sessionMessages[contact] = loadedHistory[contact];
}

const loadedNames = loadJsonFile<Record<string, string>>(namesPath);
if (loadedNames) {
    knownNames = { ...knownNames, ...loadedNames };
}

const saveMessages = () => saveJsonFile(historyPath, sessionMessages);
export const saveNames = () => saveJsonFile(namesPath, knownNames);

function appendMessageAndBroadcast(contactId: string, msg: SessionMessage) {
    if (!sessionMessages[contactId]) sessionMessages[contactId] = [];
    sessionMessages[contactId].push(msg);
    saveMessages();
    broadcastMessage({ contactId, ...msg, source: "signal" });
}

export const signalSend = (from: string, to: string, message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const args = ["--config", CONFIG_DIR, "--dbus", "-a", from, "send", "-m", message, to];

        const child = spawn(SIGNAL_CLI_PATH, args, {
            shell: false,
            env: {
                ...process.env,
                LANG: "C.UTF-8",
                LC_ALL: "C.UTF-8",
                DBUS_SESSION_BUS_ADDRESS: process.env.DBUS_SESSION_BUS_ADDRESS,
            },
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (d) => (stdout += d.toString("utf8")));
        child.stderr.on("data", (d) => (stderr += d.toString("utf8")));

        child.on("close", (code) => {
            if (code !== 0) {
                console.error("[Signal SEND error]", stderr);
                return reject(stderr || `signal-cli exited with code ${code}`);
            }

            const msg: SessionMessage = { from: "me", body: message, timestamp: Date.now() };
            appendMessageAndBroadcast(to, msg);
            resolve(stdout.trim());
        });
    });
};

export const sendSignalMediaMessage = async ({
    from,
    to,
    filePath,
}: {
    from: string;
    to: string;
    filePath: string;
}) => {
    const args = ["--config", CONFIG_DIR, "--dbus", "-a", from, "send", to, "-a", filePath];

    await new Promise<void>((resolve, reject) => {
        const child = spawn(SIGNAL_CLI_PATH, args, {
            shell: false,
            env: {
                ...process.env,
                LANG: "C.UTF-8",
                LC_ALL: "C.UTF-8",
                DBUS_SESSION_BUS_ADDRESS: process.env.DBUS_SESSION_BUS_ADDRESS,
            },
        });

        let stderr = "";
        child.stderr.on("data", (d) => (stderr += d.toString("utf8")));

        child.on("close", (code) => {
            if (code !== 0) return reject(stderr || `signal-cli exited with code ${code}`);
            resolve();
        });
    });

    const extension = path.extname(filePath).toLowerCase();
    const isImage = [".jpg", ".jpeg", ".png"].includes(extension);
    const isVideo = [".mp4", ".mov", ".webm"].includes(extension);

    const mediaType = isImage ? "image" : isVideo ? "video" : undefined;
    const mediaUrl = `/uploads/${path.basename(filePath)}`;

    const msg: SessionMessage = {
        from: "me",
        body: "",
        timestamp: Date.now(),
        mediaUrl,
        mediaType,
    };

    appendMessageAndBroadcast(to, msg);
};

async function processSignalEnvelope(rootObj: any) {
    const envelope = rootObj.envelope;
    if (!envelope) return;

    let contactId: string | null = null;
    let body = "";
    let from = "";
    let timestamp = envelope.timestamp;
    let mediaUrl: string | undefined;
    let mediaType: "image" | "video" | undefined;
    let shouldNotify = false;

    if (envelope.syncMessage?.sentMessage) {
        const sentMsg = envelope.syncMessage.sentMessage;
        from = "me";
        body = sentMsg.message || "";
        timestamp = sentMsg.timestamp || Date.now();
        contactId = sentMsg.groupInfo ? `${sentMsg.groupInfo.groupId}=` : sentMsg.destination;
        if (sentMsg.attachments?.length) {
            const media = await processJsonAttachments(sentMsg.attachments);
            if (media) {
                mediaUrl = media.url;
                mediaType = media.type;
            }
        }
    } else if (envelope.dataMessage) {
        const dataMsg = envelope.dataMessage;
        from = envelope.source;
        body = dataMsg.message || "";
        timestamp = dataMsg.timestamp || Date.now();
        shouldNotify = true;
        contactId = dataMsg.groupInfo ? `${dataMsg.groupInfo.groupId}=` : envelope.source;
        if (dataMsg.attachments?.length) {
            const media = await processJsonAttachments(dataMsg.attachments);
            if (media) {
                mediaUrl = media.url;
                mediaType = media.type;
            }
        }
    } else {
        return;
    }

    if (!contactId) return;
    if (timestamp < 1e12) timestamp *= 1000;

    if (!knownNames[contactId] && from !== "me") {
        knownNames[contactId] = rootObj.envelope.sourceName || envelope.source || contactId;
        saveNames();
    }

    const finalMsg: SessionMessage = { from, body, timestamp, mediaUrl, mediaType };

    const isOld = Date.now() - timestamp > 10_000;
    if (!isOld && shouldNotify && from !== "me") {
        const senderName = knownNames[envelope.source] || envelope.source;
        const announcement = `Nowa wiadomość od ${senderName}. ${body}`;
        try {
            const { audioId } = await speakText(announcement);
            (finalMsg as any).audioId = audioId;
        } catch (e) {
            console.error("TTS Error:", e);
        }
    }

    appendMessageAndBroadcast(contactId, finalMsg);
}

async function processJsonAttachments(
    attachments: any[]
): Promise<{ url: string; type: "image" | "video" } | null> {
    const att = attachments[0];
    if (!att) return null;

    const sourcePath = att.storedFilename;
    if (!sourcePath || !fs.existsSync(sourcePath)) return null;

    const extension = path.extname(sourcePath).toLowerCase() || ".dat";
    const newFileName = `signal-media-${Date.now()}${extension}`;
    const destinationPath = path.join(UPLOADS_DIR, newFileName);

    try {
        fs.copyFileSync(sourcePath, destinationPath);
        const isVideo = att.contentType?.startsWith("video") || extension.includes("mp4");
        return { url: `/uploads/${newFileName}`, type: isVideo ? "video" : "image" };
    } catch {
        return null;
    }
}

export async function isSignalLinked(): Promise<boolean> {
    const dataDir = path.join(CONFIG_DIR, "data");
    if (!fs.existsSync(dataDir)) return false;

    try {
        const entries = await fs.promises.readdir(dataDir, { withFileTypes: true });
        return entries.some((e) => e.isDirectory() && e.name.endsWith(".d"));
    } catch {
        return false;
    }
}
