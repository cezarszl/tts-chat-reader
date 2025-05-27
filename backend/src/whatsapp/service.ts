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

whatsappClient.on('ready', async () => {

    console.log('✅ WhatsApp client is ready!');
    const contacts = await whatsappClient.getContacts();

});


whatsappClient.initialize();
