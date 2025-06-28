import fs from 'fs';
import axios from 'axios';
import { v4 as uuid } from 'uuid';
import path from 'path';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID!;
const OUTPUT_DIR = path.resolve(__dirname, 'audio');

export const speakText = async (text: string): Promise<string> => {
    const filename = `${uuid()}.mp3`;
    const filePath = path.join(OUTPUT_DIR, filename);

    const response = await axios({
        method: 'POST',
        url: `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
        },
        responseType: 'stream',
        data: {
            text,
            voice_settings: {
                stability: 0.4,
                similarity_boost: 0.75,
            },
        },
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
    });
};
