import { exec, spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs';
import path from 'path';
import { broadcastMessage } from '../ws';
import { speakText } from '../tts';
import { SessionMessage } from '../types/SessionMessage';
import { LinkState } from '../types/LinkState';
import QRCode from 'qrcode';
import util from 'util';
import { MESSAGES_DIR, UPLOADS_DIR, SIGNAL_CONFIG_DIR } from "../config/paths";

const execAsync = util.promisify(exec);
const SIGNAL_CLI_PATH = process.env.SIGNAL_CLI_PATH ?? 'signal-cli';
const CONFIG_DIR = SIGNAL_CONFIG_DIR;

const historyPath = path.join(MESSAGES_DIR, "signal-history.json");
const namesPath = path.join(MESSAGES_DIR, "signal-names.json");

export const MY_NUMBER = process.env.SIGNAL_PHONE_NUMBER!;
export const sessionMessages: Record<string, SessionMessage[]> = {};
export let knownNames: Record<string, string> = {}
const state: LinkState = {
    child: undefined,
    qrDataUrl: null,
    startedAt: undefined,
    completed: false,
    timeout: undefined,
};

let daemonProcess: ChildProcessWithoutNullStreams | null = null;

export function startSignalDaemon() {
    if (daemonProcess) {
        console.log('⚠️ Signal daemon is already running.');
        return;
    }

    console.log('🚀 Starting Signal daemon...');

    daemonProcess = spawn(SIGNAL_CLI_PATH, [
        '--config', CONFIG_DIR,
        '--output=json',
        'daemon',
        '--dbus'
    ], {
        env: process.env
    });

    let buffer = '';

    daemonProcess.stdout.on('data', async (chunk) => {
        buffer += chunk.toString();

        const lines = buffer.split('\n');

        buffer = lines.pop() || '';

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const jsonMsg = JSON.parse(line);
                await processSignalEnvelope(jsonMsg);
            } catch (err) {
                console.error('❌ Error parsing Signal JSON line:', err);
            }
        }
    });

    daemonProcess.stderr.on('data', (data) => {
        const log = data.toString();
        if (log.toLowerCase().includes('error')) {
            console.error('[Signal Daemon STDERR]:', log);
        }
    });

    daemonProcess.on('close', (code) => {
        console.log(`💀 Signal daemon exited with code ${code}. Restarting in 5s...`);
        daemonProcess = null;
        setTimeout(startSignalDaemon, 5000);
    });
}

async function processSignalEnvelope(rootObj: any) {
    const envelope = rootObj.envelope;
    if (!envelope) return;

    let contactId: string | null = null;
    let body = '';
    let from = '';
    let timestamp = envelope.timestamp;
    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;
    let shouldNotify = false;

    if (envelope.syncMessage && envelope.syncMessage.sentMessage) {
        const sentMsg = envelope.syncMessage.sentMessage;

        from = 'me';
        body = sentMsg.message || '';
        timestamp = sentMsg.timestamp || Date.now();

        if (sentMsg.groupInfo) {
            contactId = sentMsg.groupInfo.groupId + '=';
        } else {
            contactId = sentMsg.destination;
        }

        if (sentMsg.attachments?.length) {
            const media = await processJsonAttachments(sentMsg.attachments);
            if (media) { mediaUrl = media.url; mediaType = media.type; }
        }
    }

    else if (envelope.dataMessage) {
        const dataMsg = envelope.dataMessage;

        from = envelope.source;
        body = dataMsg.message || '';
        timestamp = dataMsg.timestamp || Date.now();
        shouldNotify = true;

        if (dataMsg.groupInfo) {
            contactId = dataMsg.groupInfo.groupId + '=';
        } else {
            contactId = envelope.source;
        }

        if (dataMsg.attachments?.length) {
            const media = await processJsonAttachments(dataMsg.attachments);
            if (media) { mediaUrl = media.url; mediaType = media.type; }
        }
    }

    else {
        return;
    }

    if (!contactId) return;

    if (timestamp < 1e12) timestamp *= 1000;

    if (!knownNames[contactId] && from !== 'me') {
        knownNames[contactId] = rootObj.envelope.sourceName || envelope.source || contactId;
    }

    const finalMsg: SessionMessage = {
        from,
        body,
        timestamp,
        mediaUrl,
        mediaType
    };

    if (!sessionMessages[contactId]) sessionMessages[contactId] = [];

    const isOld = Date.now() - timestamp > 10_000;

    if (!isOld && shouldNotify && from !== 'me') {
        const senderName = knownNames[envelope.source] || envelope.source;
        const announcement = `Nowa wiadomość od ${senderName}. ${body}`;

        try {
            const { audioId } = await speakText(announcement);
            (finalMsg as any).audioId = audioId;
        } catch (e) {
            console.error('TTS Error:', e);
        }
    }

    sessionMessages[contactId].push(finalMsg);
    saveMessages(); // Zapis do pliku JSON historii

    broadcastMessage({ contactId, ...finalMsg, source: 'signal' });
}

async function processJsonAttachments(attachments: any[]): Promise<{ url: string, type: 'image' | 'video' } | null> {
    const att = attachments[0];
    if (!att) return null;

    const sourcePath = att.storedFilename;

    if (!sourcePath || !fs.existsSync(sourcePath)) {
        return null;
    }

    const extension = path.extname(sourcePath).toLowerCase() || '.dat';
    const newFileName = `signal-media-${Date.now()}${extension}`;
    const destinationPath = path.join(UPLOADS_DIR, newFileName);

    try {
        fs.copyFileSync(sourcePath, destinationPath);

        const isVideo = att.contentType?.startsWith('video') || extension.includes('mp4');
        return {
            url: `/uploads/${newFileName}`,
            type: isVideo ? 'video' : 'image'
        };
    } catch (e) {
        console.error('Failed to process Signal attachment:', e);
        return null;
    }
}

export async function isSignalLinked(): Promise<boolean> {
    try {
        const dataDir = path.join(CONFIG_DIR, 'data');
        const entries = await fs.promises.readdir(dataDir, { withFileTypes: true });

        const hasAccountDir = entries.some(
            (e) => e.isDirectory() && e.name.endsWith('.d')
        );

        const accountsJsonPath = path.join(dataDir, 'accounts.json');
        let hasAccountsJson = false;
        try {
            await fs.promises.access(accountsJsonPath, fs.constants.R_OK);
            hasAccountsJson = true;
        } catch {
            hasAccountsJson = false;
        }

        return hasAccountDir && hasAccountsJson;
    } catch (e) {
        console.error('isSignalLinked fs error:', e);
        return false;
    }
}

export function startSignalLink(deviceName = 'MyChatReader', timeoutMs = 3 * 60 * 1000): void {
    if (state.child && !state.completed) return;

    cancelSignalLink();

    const child = spawn(SIGNAL_CLI_PATH, ['--config', CONFIG_DIR, 'link', '-n', deviceName]);
    state.child = child;
    state.startedAt = Date.now();
    state.completed = false;

    let buffer = '';

    child.stdout.on('data', async (chunk) => {
        buffer += chunk.toString();
        const nl = buffer.indexOf('\n');

        if (nl !== -1 && !state.qrDataUrl) {
            const firstLine = buffer.slice(0, nl).trim();
            if (firstLine.startsWith('sgnl://')) {
                state.qrDataUrl = await QRCode.toDataURL(firstLine, { width: 360, margin: 1 });
                state.timeout = setTimeout(() => {
                    cancelSignalLink();
                }, timeoutMs);
            }
        }
    });
    child.stderr.on('data', () => { /* opcjonalnie log */ });

    child.on('close', async () => {
        if (state.timeout) clearTimeout(state.timeout);

        const linked = await isSignalLinked(); // Sprawdzamy czy się udało

        if (linked) {
            console.log('✅ Linking successful! Starting daemon now...');
            state.completed = true;
            state.qrDataUrl = null;
            startSignalDaemon();
        } else {
            console.log('❌ Linking failed or timed out.');
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

    try { state.child?.kill('SIGINT'); } catch { }
    state.child = undefined;

    state.qrDataUrl = null;
    state.startedAt = undefined;
    state.completed = false;
}


if (fs.existsSync(historyPath)) {
    const file = fs.readFileSync(historyPath, 'utf-8');
    const loaded = JSON.parse(file);

    for (const contact in loaded) {
        sessionMessages[contact] = loaded[contact];
    }
}

if (fs.existsSync(namesPath)) {
    Object.assign(knownNames, JSON.parse(fs.readFileSync(namesPath, 'utf-8')));
}

const saveMessages = () => {
    fs.writeFileSync(historyPath, JSON.stringify(sessionMessages, null, 2));
};

export const saveNames = () => {
    fs.writeFileSync(namesPath, JSON.stringify(knownNames, null, 2));
};

export const signalSend = (from: string, to: string, message: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const args = [
            "--config", CONFIG_DIR,
            "--dbus",
            "-a",
            from,
            "send",
            "-m",
            message,
            to,
        ];

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

        child.on("error", (err) => {
            console.error("[Signal SEND spawn error]", err);
            reject(String(err));
        });

        child.on("close", (code) => {
            if (code !== 0) {
                console.error("[Signal SEND error]", stderr);
                return reject(stderr || `signal-cli exited with code ${code}`);
            }

            const msg = {
                from: "me",
                body: message,
                timestamp: Date.now(),
            };

            if (!sessionMessages[to]) sessionMessages[to] = [];
            sessionMessages[to].push(msg);
            saveMessages();
            broadcastMessage({ contactId: to, ...msg, source: "signal" });

            resolve(stdout.trim());
        });
    });
};

export const signalReceive = (from: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const cmd = `${SIGNAL_CLI_PATH} --config ${CONFIG_DIR} -a ${from} receive`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.error('[Signal RECEIVE error]', stderr);
                reject(stderr.toString());
            } else {
                resolve(stdout.toString());
            }
        });
    });
};

export const checkSignalReady = () => {
    const cmd = `${SIGNAL_CLI_PATH} --config ${CONFIG_DIR} -a ${MY_NUMBER} listDevices`;

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error('❌ Signal is not authenticated or not registered:', stderr.trim());
        } else {
            console.log('✅ Signal client is authenticated and ready!');
        }
    });
};

export const sendSignalMediaMessage = async ({ from, to, filePath }: { from: string, to: string, filePath: string }) => {
    const cmd = `${SIGNAL_CLI_PATH} --config ${CONFIG_DIR} -a ${from} send ${to} -a "${filePath}"`;
    await execAsync(cmd)

    const isImage = filePath.match(/\.(jpg|jpeg|png)$/i);
    const isVideo = filePath.match(/\.(mp4|mov|webm)$/i);

    const mediaType = isImage ? 'image' : isVideo ? 'video' : undefined;
    const mediaUrl = `/uploads/${path.basename(filePath)}`;

    const msg = {
        from: 'me',
        body: '',
        timestamp: Date.now(),
        mediaUrl,
        mediaType,
    };

    if (!sessionMessages[to]) sessionMessages[to] = [];
    sessionMessages[to].push(msg);
    saveMessages();

    broadcastMessage({ contactId: to, ...msg, source: 'signal' });
}



