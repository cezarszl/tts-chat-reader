import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { broadcastMessage } from '../ws';
import { speakText } from '../tts';

const historyPath = path.resolve(__dirname, 'whatsapp-history.json');

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

    if (message.from === 'status@broadcast') {
        return;
    }
    const contactId = message.fromMe ? message.to : message.from;

    const contact = await whatsappClient.getContactById(contactId);

    const msg = {
        from: message.fromMe ? 'me' : (contact.pushname || contact.name || contact.number || contactId),
        rawFrom: contactId,
        body: message.body,
        timestamp: Date.now(),
    };

    if (!sessionMessages[contactId]) {
        sessionMessages[contactId] = [];
    }

    // If the message is older than 10 seconds, skip TTS and just broadcast
    saveMessages();
    if (Date.now() - msg.timestamp > 10_000) {
        sessionMessages[contactId].push(msg);
        broadcastMessage({ contactId, ...msg, source: 'whatsapp' });
        return;
    } else {
        const senderName = contact.pushname || contact.name || contact.number || contactId;
        const announcement = `Nowa wiadomość od ${senderName}. ${msg.body}`;
        const { audioId } = await speakText(announcement);
        const fullMsg = { ...message, audioId };

        sessionMessages[contactId].push(msg);
        broadcastMessage({ contactId, ...fullMsg, source: 'whatsapp' });

    }
});


whatsappClient.on('message_create', async (msg) => {
    if (!msg.fromMe) return;



    const contactId = msg.to;

    const outgoing = {
        from: 'me',
        body: msg.body,
        timestamp: Date.now(),
    };

    if (!sessionMessages[contactId]) {
        sessionMessages[contactId] = [];
    }

    sessionMessages[contactId].push(outgoing);
    saveMessages();

    broadcastMessage({ contactId, ...outgoing, source: 'whatsapp' });
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
    isAuthenticated = false;
});

whatsappClient.on('ready', async () => {

    console.log('✅ WhatsApp client is ready!');

});


whatsappClient.initialize();

