import { Router } from 'express';
import { sendTextMessage, receiveMessages } from '../signal/service';

const router = Router();

router.post('/send', async (req, res) => {
    const { from, to, message } = req.body;
    try {
        const result = await sendTextMessage(from, to, message);
        res.json({ success: true, output: result });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

router.get('/receive/:from', async (req, res) => {
    const { from } = req.params;
    try {
        const messages = await receiveMessages(from);
        res.json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err });
    }
});

export default router;
