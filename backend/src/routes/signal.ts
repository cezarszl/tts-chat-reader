import { Router } from 'express';
import { signalSend, sessionMessages, knownNames, MY_NUMBER } from '../signal';

const router = Router();

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
        const isGroup = id.endsWith('=');
        return { id, name, isGroup };
    });

    res.json(contacts);
});

export default router;
