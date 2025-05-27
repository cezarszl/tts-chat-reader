import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { broadcastMessage } from '../ws';

const historyPath = path.resolve(__dirname, '../../chat-history.json');

export let qrCodeBase64 = '';
export let isAuthenticated = false;

export const whatsappClient = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

export const sessionMessages: Record<string, { from: string, body: string, timestamp: number }[]> = {};

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

whatsappClient.on('message', async (message) => {
    if (!message.fromMe) {
        const msg = {
            from: message.from,
            body: message.body,
            timestamp: Date.now(),
        };
        if (!sessionMessages[message.from]) {
            sessionMessages[message.from] = [];
        }
        sessionMessages[message.from].push(msg);
        saveMessages();

        broadcastMessage({ contact: message.from, ...msg });
    }
});


whatsappClient.on('qr', async qr => {
    console.log('🔐 QR code received (new)');
    isAuthenticated = false;
    qrCodeBase64 = await qrcode.toDataURL(qr);
});

whatsappClient.on('authenticated', () => {
    console.log('✅ Authenticated with WhatsApp.');
    isAuthenticated = true;
});

whatsappClient.on('auth_failure', msg => {
    console.log('❌ Auth failed:', msg);
});

whatsappClient.on('ready', async () => {

    console.log('✅ WhatsApp client is ready!');
    const contacts = await whatsappClient.getContacts();

});


whatsappClient.initialize();
