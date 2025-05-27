import { Router } from 'express';
import { signalSend, receiveMessages, sessionMessages } from '../signal';

const router = Router();

router.post('/send', async (req, res) => {
    const { from, to, message } = req.body;
    try {
        const result = await signalSend(from, to, message);
        res.json({ success: true, output: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

router.get('/messages', async (req, res) => {
    const rawFrom = req.query.from as string;
    const from = rawFrom.replace(/\s/g, '').startsWith('+') ? rawFrom.replace(/\s/g, '') : '+' + rawFrom.replace(/\s/g, '');
    if (!from || typeof from !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid "from"' });
    }

    try {
        await receiveMessages(from);
        console.log('📨 From:', from);
        console.log('📨 Messages:', sessionMessages[from]);
        res.json(sessionMessages[from] || []);
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

export default router;
