import { Router } from 'express';
import path from 'path';
import fs from 'fs';


const router = Router();

const AUDIO_DIR = path.resolve(__dirname, '../tts/audio');

if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

router.get('/:audioId', (req, res) => {
    const audioId = req.params.audioId;
    const filePath = path.join(AUDIO_DIR, `${audioId}.mp3`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Audio not found');
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    fs.createReadStream(filePath).pipe(res);
});

export default router;
