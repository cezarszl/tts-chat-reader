import { Router } from 'express';
import { whatsappClient, qrCodeBase64, getReceivedMessages } from '../whatsapp';


const router = Router();

router.get('/auth/qr', (req, res) => {
    if (qrCodeBase64) {
        res.json({ qr: qrCodeBase64 });
    } else {
        res.status(404).json({ error: 'QR code not ready' });
    }
});

router.get('/messages', (req, res) => {
    res.json({ messages: getReceivedMessages() });
});

router.post('/send', async (req, res) => {
    console.log('[DEBUG] client ready?', !!whatsappClient.info);
    console.log('[DEBUG] client wid:', whatsappClient.info?.wid);

    const { to, message } = req.body;

    if (!whatsappClient.info || !whatsappClient.info.wid) {
        return res.status(503).json({ error: 'WhatsApp client is not ready yet.' });
    }

    try {
        await whatsappClient.sendMessage(to, message);
        res.json({ success: true });
    } catch (err) {
        console.error('[❌ WhatsApp SEND error]', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export default router;
