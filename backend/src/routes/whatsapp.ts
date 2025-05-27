import { Router } from 'express';
import { whatsappClient, qrCodeBase64 } from '../whatsapp';



const router = Router();

router.get('/auth/qr', (req, res) => {
    if (qrCodeBase64) {
        res.json({ qr: qrCodeBase64 });
    } else {
        res.status(404).json({ error: 'QR code not ready' });
    }
});

export default router;
