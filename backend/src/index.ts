import express from 'express';
import cors from 'cors';
import { qrCodeBase64 } from './whatsapp';

const app = express();
const port = process.env.BACKEND_PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

app.get('/auth/qr', (req, res) => {
    if (qrCodeBase64) {
        res.json({ qr: qrCodeBase64 });
    } else {
        res.status(404).json({ error: 'QR code not ready' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Backend running at http://localhost:${port}`);
});

