import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode';

export let qrCodeBase64 = '';

export const whatsappClient = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

const messages: { from: string; body: string; timestamp: number }[] = [];

export const getReceivedMessages = () => messages;

whatsappClient.on('qr', async qr => {
    console.log('🔐 QR code received (new)');
    qrCodeBase64 = await qrcode.toDataURL(qr);
});

whatsappClient.on('authenticated', () => {
    console.log('✅ Authenticated with WhatsApp.');
});

whatsappClient.on('auth_failure', msg => {
    console.log('❌ Auth failed:', msg);
});

whatsappClient.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
});

whatsappClient.on('message', (msg: Message) => {
    if (!msg.fromMe) {
        messages.push({
            from: msg.from,
            body: msg.body,
            timestamp: msg.timestamp,
        });
        console.log(`[📩 WhatsApp] ${msg.from}: ${msg.body}`);
    }
});

whatsappClient.initialize();
