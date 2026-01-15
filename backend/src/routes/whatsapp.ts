import { Router } from 'express';
import { whatsappClient, qrCodeBase64, isAuthenticated, sessionMessages } from '../whatsapp';
import upload from '../middleware/upload';
import { MessageMedia } from 'whatsapp-web.js';



const router = Router();

router.get('/auth/qr', (req, res) => {
    if (isAuthenticated) {
        return res.status(200).json({ qr: false }); // już zalogowany
    }

    if (qrCodeBase64) {
        return res.status(200).json({ qr: qrCodeBase64 });
    }

    return res.status(404).json({ error: 'QR code not ready' });
});


router.get('/messages', (req, res) => {
    res.json(sessionMessages);
});

router.get('/contacts', async (req, res) => {
    const result = [];

    for (const contactId of Object.keys(sessionMessages)) {
        const contact = await whatsappClient.getContactById(contactId);
        const messages = sessionMessages[contactId];
        const lastMessage = messages[messages.length - 1];
        result.push({
            id: contactId,
            name: contact.pushname || contact.name || contact.number || contactId,
            lastTimestamp: lastMessage?.timestamp ?? null,
            lastMessage: lastMessage?.body ?? null,
            lastMediaType: lastMessage?.mediaType ?? null,
        });
    }

    result.sort((a, b) => {
        const timeA = a.lastTimestamp || 0;
        const timeB = b.lastTimestamp || 0;
        return timeB - timeA;
    })

    res.json(result);
});


router.get('/messages/:contactId', (req, res) => {
    const contact = req.params.contactId;
    res.json(sessionMessages[contact] || []);
});

router.get('/session', (req, res) => {
    res.json({ authenticated: isAuthenticated });
});

router.post('/send', async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
        return res.status(400).json({ error: 'Missing "to" or "message"' });
    }

    try {
        await whatsappClient.sendMessage(to, message, { sendSeen: false });
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

router.post('/send-media', upload.single('file'), async (req, res) => {
    const { to } = req.body;
    const filePath = req.file?.path;

    if (!to || !filePath) {
        return res.status(400).json({ error: 'Missing recipient or file' });
    }

    try {
        const media = MessageMedia.fromFilePath(filePath);
        await whatsappClient.sendMessage(to, media, { sendMediaAsDocument: true });

        res.json({ success: true });
    } catch (err) {
        console.error('[WhatsApp SEND-MEDIA error]', err);
        res.status(500).json({ error: 'Failed to send media' });
    }
});
export default router;
