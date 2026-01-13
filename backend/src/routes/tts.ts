import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { TTS_AUDIO_DIR } from "../config/paths";

const router = Router();

router.get('/:audioId', (req, res) => {
    const audioId = req.params.audioId;
    const filePath = path.join(TTS_AUDIO_DIR, `${audioId}.mp3`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Audio not found');
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    fs.createReadStream(filePath).pipe(res);
});

export default router;
