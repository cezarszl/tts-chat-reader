import path from "path";
import fs from "fs";

export const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), "data");

export const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(DATA_DIR, "uploads");
export const TTS_DIR = process.env.TTS_DIR || path.join(DATA_DIR, "tts");
export const TTS_AUDIO_DIR = path.join(TTS_DIR, "audio");

export const SIGNAL_CONFIG_DIR = process.env.SIGNAL_CONFIG_DIR || path.join(DATA_DIR, "signal");
export const MESSAGES_DIR = process.env.MESSAGES_DIR || path.join(DATA_DIR, "messages");
export const WHATSAPP_CONFIG_DIR = process.env.WHATSAPP_CONFIG_DIR || path.join(DATA_DIR, "whatsapp");
export const WHATSAPP_AUTH_DIR = process.env.WHATSAPP_AUTH_DIR || path.join(WHATSAPP_CONFIG_DIR, "session");
export const WHATSAPP_CACHE_DIR = process.env.WHATSAPP_CACHE_DIR || path.join(WHATSAPP_CONFIG_DIR, "cache");


export function ensureDirs() {
    [UPLOADS_DIR, TTS_AUDIO_DIR, SIGNAL_CONFIG_DIR, MESSAGES_DIR, WHATSAPP_AUTH_DIR, WHATSAPP_CACHE_DIR].forEach((dir) =>
        fs.mkdirSync(dir, { recursive: true })
    );
}
