import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { broadcastMessage } from '../ws';
import { speakText } from '../tts';

const SIGNAL_CLI_PATH = '/home/cezarszl/apps/signal-cli/signal-cli';
const CONFIG_DIR = '/home/cezarszl/.local/share/signal-cli';
const historyPath = path.resolve(__dirname, 'signal-history.json');
const namesPath = path.resolve(__dirname, 'signal-names.json');



export const MY_NUMBER = process.env.SIGNAL_PHONE_NUMBER!;

export const sessionMessages: Record<string, { from: string; body: string; timestamp: number }[]> = {};
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

                broadcastMessage({ contactId: to, ...msg, source: 'signal' });

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
    const output = await signalReceive(from);
    const blocks = output.trim().split('\n\n');

    for (const block of blocks) {
        const parsed = parseBlock(block);
        if (!parsed) {
            continue;
        }

        const { contactId, displayName, message } = parsed;

        if (!knownNames[contactId]) {
            knownNames[contactId] = displayName!;
            saveNames();
        }

        if (!sessionMessages[contactId]) sessionMessages[contactId] = [];
        sessionMessages[contactId].push(message);

        const announcement = `Nowa wiadomość od ${displayName}. ${message.body}`;
        const { audioId } = await speakText(announcement);
        broadcastMessage({ contactId, ...message, source: 'signal', audioId });


    }
    saveMessages();
};

const parseBlock = (block: string) => {
    const bodyMatch = block.match(/^\s*Body:\s+([\s\S]*?)(?:\n|$)/m);
    const timestampMatch = block.match(/Message timestamp:\s+(\d+)/) || block.match(/Timestamp:\s+(\d+)/);
    const groupMatch = block.match(/Group info:[\s\S]*?Id:\s+(.+)=/m);
    const groupNameMatch = block.match(/Group info:[\s\S]*?Name:\s+(.+)/m);
    let contactId: string | null = null;
    let displayName: string | null = null;
    let sender: string | null = null;

    if (!bodyMatch) return null;

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

    return {
        contactId,
        displayName,
        message: {
            from: sender,
            body: bodyMatch[1].trim(),
            timestamp: timestampMatch ? Number(timestampMatch[1]) : Date.now(),
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



