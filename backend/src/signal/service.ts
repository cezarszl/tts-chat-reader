import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { broadcastMessage } from '../ws';
import { speakText } from '../tts';
import { SessionMessage } from '../types/SessionMessage';

import util from 'util';

const execAsync = util.promisify(exec);
const SIGNAL_CLI_PATH = '/home/cezarszl/apps/signal-cli/bin/signal-cli';
const CONFIG_DIR = '/home/cezarszl/.local/share/signal-cli';
const historyPath = path.resolve(__dirname, 'signal-history.json');
const namesPath = path.resolve(__dirname, 'signal-names.json');



export const MY_NUMBER = process.env.SIGNAL_PHONE_NUMBER!;

export const sessionMessages: Record<string, SessionMessage[]> = {};
export let knownNames: Record<string, string> = {}

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
        const cmd = `${SIGNAL_CLI_PATH} --config ${CONFIG_DIR} -a ${from} send -m "${message}" ${to}`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.error('[Signal SEND error]', stderr);
                reject(stderr.toString());
            } else {
                const msg = {
                    from: 'me',
                    body: message,
                    timestamp: Date.now(),
                };

                if (!sessionMessages[to]) sessionMessages[to] = [];
                sessionMessages[to].push(msg);
                saveMessages();
                if (Date.now() - msg.timestamp > 10_000) {
                    broadcastMessage({ contactId: to, ...msg, source: 'signal' });
                }
                resolve(stdout.toString().trim());
            }
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

export const receiveMessages = async (from: string) => {
    try {
        const output = await signalReceive(from);
        const blocks = output.trim().split('\n\n');

        for (const block of blocks) {
            try {
                const parsed = parseBlock(block);
                if (!parsed) continue;

                const { contactId, displayName, message } = parsed;

                if (!knownNames[contactId]) {
                    knownNames[contactId] = displayName!;
                    saveNames();
                }

                if (!sessionMessages[contactId]) sessionMessages[contactId] = [];

                // If the message is older than 10 seconds, skip TTS and just broadcast

                const isOld = Date.now() - message.timestamp > 10_000;
                if (isOld) {
                    sessionMessages[contactId].push(message);
                    broadcastMessage({ contactId, ...message, source: 'signal' });
                    continue;
                } else {
                    const announcement = `Nowa wiadomość od ${displayName}. ${message.body}`;
                    const { audioId } = await speakText(announcement);
                    const fullMsg: SessionMessage = { ...message, audioId };
                    sessionMessages[contactId].push(fullMsg);

                    broadcastMessage({ contactId, ...fullMsg, source: 'signal' });

                }
                saveMessages();

            } catch (err) {
                console.error('⚠️ Error while processing a single message block:', err);
            }
        }

    } catch (err) {
        console.error('❌ Error in receiveMessages (whole batch):', err);
    }
};


const parseBlock = (block: string): {
    contactId: string;
    displayName: string;
    message: SessionMessage;
} | null => {


    const attachmentMatch = block.match(/Stored plaintext in:\s+(.+\.jpg|.+\.jpeg|.+\.png|.+\.mp4)/i);

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;

    if (attachmentMatch) {
        const tempPath = attachmentMatch[1].trim();
        const extension = path.extname(tempPath).toLowerCase();

        const fileName = `media-${Date.now()}${extension}`;
        const finalPath = path.resolve(__dirname, '../../uploads', fileName);

        try {
            fs.copyFileSync(tempPath, finalPath);

            mediaUrl = `/uploads/${fileName}`;
            mediaType = extension.includes('mp4') ? 'video' : 'image';
        } catch (err) {
            console.error('❌ Failed to copy media file from Signal:', err);
        }
    }


    const bodyMatch = block.match(/^\s*Body:\s+([\s\S]*?)(?:\n|$)/m);
    const timestampMatch = block.match(/Message timestamp:\s+(\d+)/) || block.match(/Timestamp:\s+(\d+)/);
    const groupMatch = block.match(/Group info:[\s\S]*?Id:\s+(.+)=/m);
    const groupNameMatch = block.match(/Group info:[\s\S]*?Name:\s+(.+)/m);
    let contactId: string | null = null;
    let displayName: string = 'Unknown';
    let sender: string | null = null;

    if (!bodyMatch && !attachmentMatch) return null;

    if (block.includes('Received sync sent message')) {
        const toMatch = block.match(/^\s*To:\s+["“”]?(.+?)["“”]?\s+(\+[\d]+)/m);
        if (toMatch) {
            displayName = toMatch[1].trim();
            sender = toMatch[2].trim();
        }
    } else {
        const fromMatch = block.match(/Envelope from:\s+["“”]?(.+?)["“”]?\s+(\+[\d]+)/);
        if (fromMatch) {
            displayName = fromMatch[1].trim();
            sender = fromMatch[2].trim();
        }
    }

    if (!sender) return null;

    contactId = groupMatch ? groupMatch[1] + '=' : sender;
    displayName = groupMatch ? (groupNameMatch?.[1].trim() ?? 'Unknown Group') : displayName;

    let rawTimestamp = timestampMatch ? Number(timestampMatch[1]) : Date.now();
    if (rawTimestamp > 1e12) {
        rawTimestamp = Math.floor(rawTimestamp / 1000);
    }
    const finalTimestamp = rawTimestamp < 1e12 ? rawTimestamp * 1000 : rawTimestamp;

    return {
        contactId,
        displayName,
        message: {
            from: sender,
            body: bodyMatch?.[1]?.trim() ?? '',
            timestamp: finalTimestamp,
            mediaUrl,
            mediaType,
        },
    };
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
    const cmd = `signal-cli -u ${from} send ${to} -a "${filePath}"`;
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



