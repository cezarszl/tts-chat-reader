import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { broadcastMessage } from '../ws';
import { speakText } from '../tts';
import { SessionMessage } from '../types/SessionMessage';

import { MESSAGES_DIR, WHATSAPP_AUTH_DIR, WHATSAPP_CACHE_DIR, UPLOADS_DIR } from "../config/paths";

const historyPath = path.join(MESSAGES_DIR, 'whatsapp-history.json');

export let qrCodeBase64 = '';
export let isAuthenticated = false;

export const whatsappClient = new Client({
    authStrategy: new LocalAuth({
        dataPath: WHATSAPP_AUTH_DIR,
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    webVersionCache: {
        type: 'local',
        path: WHATSAPP_CACHE_DIR,
    },
});



export const sessionMessages: Record<string, SessionMessage[]> = {};

if (fs.existsSync(historyPath)) {
    const file = fs.readFileSync(historyPath, 'utf-8');
    const loaded = JSON.parse(file);

    for (const contact in loaded) {
        sessionMessages[contact] = loaded[contact];
    }
}

const saveMessages = () => {
    fs.writeFileSync(historyPath, JSON.stringify(sessionMessages, null, 2));
};




whatsappClient.on('message', async (message) => {
    if (message.from === 'status@broadcast') {
        return;
    }

    const contactId = message.fromMe ? message.to : message.from;
    const contact = await whatsappClient.getContactById(contactId);

    const baseMsg = {
        from: message.fromMe ? 'me' : (contact.pushname || contact.name || contact.number || contactId),
        body: message.body,
        timestamp: message.timestamp * 1000,
    };

    if (!sessionMessages[contactId]) {
        sessionMessages[contactId] = [];
    }

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | undefined;

    if (message.hasMedia) {
        const media = await message.downloadMedia();
        if (media) {
            const mimeType = media.mimetype;
            const extension = mimeType.split('/')[1];
            const fileName = `media-${Date.now()}.${extension}`;
            const filePath = path.join(UPLOADS_DIR, fileName);
            fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));

            mediaUrl = `/uploads/${fileName}`;
            if (mimeType.startsWith('image/')) mediaType = 'image';
            else if (mimeType.startsWith('video/')) mediaType = 'video';
            else mediaType = undefined;
        }
    }

    const enrichedMsg: SessionMessage = {
        ...baseMsg,
        mediaUrl,
        mediaType,
    };

    const isOld = Date.now() - enrichedMsg.timestamp > 10_000;

    if (isOld) {
        sessionMessages[contactId].push(enrichedMsg);
        broadcastMessage({ contactId, ...enrichedMsg, source: 'whatsapp' });
    } else {
        let fullMsg = enrichedMsg;
        if (baseMsg.body) {
            const senderName = contact.pushname || contact.name || contact.number || contactId;
            const announcement = `Nowa wiadomość od ${senderName}. ${baseMsg.body}`;
            const { audioId } = await speakText(announcement);
            fullMsg = { ...enrichedMsg, audioId };
        }
        sessionMessages[contactId].push(fullMsg);
        broadcastMessage({ contactId, ...fullMsg, source: 'whatsapp' });
    }

    saveMessages();
});



whatsappClient.on('message_create', async (msg) => {
    if (!msg.fromMe) return;

    const contactId = msg.to;

    if (!sessionMessages[contactId]) {
        sessionMessages[contactId] = [];
    }

    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        if (!media) return;

        const mimeType = media.mimetype;
        const extension = mimeType.split('/')[1];
        const fileName = `media-${Date.now()}.${extension}`;
        const filePath = path.resolve(UPLOADS_DIR, fileName);

        fs.writeFileSync(filePath, Buffer.from(media.data, 'base64'));

        const type = mimeType.startsWith('image') ? 'image' : 'video';

        const mediaMsg: SessionMessage = {
            from: 'me',
            body: msg.body,
            timestamp: msg.timestamp * 1000,
            mediaUrl: `/uploads/${fileName}`,
            mediaType: type
        };

        sessionMessages[contactId].push(mediaMsg);
        saveMessages();
        broadcastMessage({ contactId, ...mediaMsg, source: 'whatsapp' });
    } else {
        const outgoing: SessionMessage = {
            from: 'me',
            body: msg.body,
            timestamp: msg.timestamp * 1000,
        };

        sessionMessages[contactId].push(outgoing);
        saveMessages();
        broadcastMessage({ contactId, ...outgoing, source: 'whatsapp' });
    }
});





whatsappClient.on('qr', async qr => {
    console.log('🔐 QR code received (new)');
    isAuthenticated = false;
    qrCodeBase64 = await qrcode.toDataURL(qr);
});

whatsappClient.on('authenticated', () => {
    console.log('✅ Authenticated with WhatsApp.');
    isAuthenticated = true;
});

whatsappClient.on('auth_failure', msg => {
    console.log('❌ Auth failed:', msg);
    isAuthenticated = false;
});



whatsappClient.on('ready', async () => {
    console.log('✅ WhatsApp client is ready!');
});


whatsappClient.initialize();

