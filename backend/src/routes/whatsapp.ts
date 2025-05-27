import { Router } from 'express';
import { whatsappClient, qrCodeBase64, isAuthenticated } from '../whatsapp';



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

export default router;
