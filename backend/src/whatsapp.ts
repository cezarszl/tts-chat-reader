import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
});

export let qrCodeBase64 = '';

client.on('qr', async (qr) => {
    qrCodeBase64 = await qrcode.toDataURL(qr);
    console.log('🔐 QR code ready. Scan with WhatsApp.');
});

client.on('ready', () => {
    console.log('✅ WhatsApp client is ready!');
});

client.initialize();
