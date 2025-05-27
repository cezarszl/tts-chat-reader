import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode';

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

export const sessionMessages: { from: string; body: string; timestamp: number }[] = [];

whatsappClient.on('message', async (message) => {
    if (!message.fromMe) {
        const msg = {
            from: message.from,
            body: message.body,
            timestamp: Date.now(),
        };
        sessionMessages.push(msg);
        console.log('📩 New message:', msg);
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
