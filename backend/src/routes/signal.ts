import { Router } from 'express';
import {
    signalSend, sessionMessages, knownNames, MY_NUMBER, sendSignalMediaMessage, startSignalLink,
    getSignalQrBase64,
    isSignalLinked,
    isLinkingInProgress,
    cancelSignalLink,
} from '../signal';
import upload from '../middleware/upload'


const router = Router();

router.post('/auth/start', async (_req, res) => {
    if (await isSignalLinked()) {
        return res.status(200).json({ ok: true, alreadyLinked: true });
    }
    if (!isLinkingInProgress()) startSignalLink();
    return res.status(202).json({ ok: true });
});

router.get('/auth/qr', async (_req, res) => {
    if (await isSignalLinked()) {
        return res.status(200).json({ qr: false });
    }
    const qr = getSignalQrBase64();
    if (qr) return res.status(200).json({ qr });
    return res.status(404).json({ error: 'QR code not ready' });
});

router.post('/auth/cancel', (_req, res) => {
    cancelSignalLink();
    return res.json({ ok: true });
});

router.get('/session', async (_req, res) => {
    const linked = await isSignalLinked();
    return res.json({ authenticated: linked });
});

router.post('/send', async (req, res) => {
    const { to, message } = req.body;
    try {
        const result = await signalSend(MY_NUMBER, to, message);
        res.json({ success: true, output: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

router.get('/messages', (req, res) => {
    const contactId = req.query.contactId as string;

    if (!contactId) {
        return res.status(400).json({ error: 'Missing "contactId"' });
    }

    const allMessages = sessionMessages[contactId];
    res.json(allMessages || []);
});


router.get('/contacts', async (req, res) => {
    const contacts = Object.keys(sessionMessages).map((id) => {
        const name = knownNames[id] || id;

        const messages = sessionMessages[id] ?? [];
        const lastMessage = messages[messages.length - 1];

        return {
            id,
            name,
            lastMessage: lastMessage?.body ?? null,
            lastTimestamp: lastMessage?.timestamp ?? null,
        };
    });

    res.json(contacts);
});

router.post('/send-media', upload.single('file'), async (req, res) => {
    const { to, from } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;

    try {
        const isImage = req.file.mimetype.startsWith('image/');
        const isVideo = req.file.mimetype.startsWith('video/');

        if (!isImage && !isVideo) {
            return res.status(400).json({ error: 'Only image and video supported' });
        }

        await sendSignalMediaMessage({
            from,
            to,
            filePath,
        });

        res.json({ success: true });
    } catch (err) {
        console.error('Failed to send media', err);
        res.status(500).json({ error: 'Internal error' });
    }
});


export default router;
