import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { broadcastMessage } from '../ws';

const SIGNAL_CLI_PATH = '/home/cezarszl/apps/signal-cli/signal-cli';
const CONFIG_DIR = '/home/cezarszl/.local/share/signal-cli';
const historyPath = path.resolve(__dirname, '../../signal-history.json');

export const sessionMessages: Record<string, { from: string; body: string; timestamp: number }[]> = {};

if (fs.existsSync(historyPath)) {
    const file = fs.readFileSync(historyPath, 'utf-8');
    const loaded = JSON.parse(file);

    for (const contact in loaded) {
        sessionMessages[contact] = loaded[contact];
    }
}

const saveMessages = () => {
    fs.writeFileSync(historyPath, JSON.stringify(sessionMessages, null, 2));
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

                broadcastMessage({ contactId: to, ...msg });

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
    console.log('📥 signalReceive for:', from);
    const output = await signalReceive(from);
    console.log('📤 Raw output:', output);
    const messages: { from: string; body: string; timestamp: number }[] = [];

    const blocks = output.trim().split('\n\n');

    for (const block of blocks) {
        // ❌ Pomijamy wiadomości synchronizacyjne (Twoje własne)
        if (block.includes('Received sync sent message')) {
            console.warn('🔁 Skipped sync sent message block');
            continue;
        }

        const fromMatch = block.match(/Envelope from: [“"]?.*?([+]\d+)\b/);
        const bodyMatch = block.match(/Body:\s+([\s\S]*)/);
        const timestampMatch = block.match(/Timestamp:\s+(\d+)/);

        if (fromMatch && bodyMatch) {
            const msg = {
                from: fromMatch[1],
                body: bodyMatch[1].trim(),
                timestamp: timestampMatch ? Number(timestampMatch[1]) : Date.now(),
            };
            console.log('✅ Parsed message:', msg);

            if (!sessionMessages[msg.from]) {
                sessionMessages[msg.from] = [];
            }

            sessionMessages[msg.from].push(msg);
            messages.push(msg);

            broadcastMessage({ contactId: msg.from, ...msg });
        } else {
            console.warn('⚠️ Skipped block:', block);
        }
    }

    saveMessages();
    return messages;
};

