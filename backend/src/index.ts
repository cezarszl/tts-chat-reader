import express from 'express';
import cors from 'cors';
import routes from './routes';
import './whatsapp';
import { setupWebSocket } from './ws';
import { createServer } from 'http';
import { receiveMessages, checkSignalReady, isSignalLinked } from './signal/';

import { UPLOADS_DIR, ensureDirs } from "./config/paths";



const baseUrl = process.env.API_BASE_URL;
const port = process.env.BACKEND_PORT;
const MY_NUMBER = process.env.SIGNAL_PHONE_NUMBER!;

export const SIGNAL_NUMBER = MY_NUMBER;

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);

ensureDirs();
app.use("/uploads", express.static(UPLOADS_DIR));

const server = createServer(app);
setupWebSocket(server);

server.listen(port, () => {
    console.log(`🚀 Backend running at ${baseUrl}:${port}`);
});

checkSignalReady();

let receiveInFlight = false;
let lastErrorAt = 0;

setInterval(async () => {
    if (receiveInFlight) return;

    // mały backoff po błędzie (np. 2s)
    if (Date.now() - lastErrorAt < 2000) return;

    try {
        const linked = await isSignalLinked();
        if (!linked) return; // nie próbuj receive jeśli nie zalinkowane

        receiveInFlight = true;
        await receiveMessages(SIGNAL_NUMBER);
    } catch (e) {
        lastErrorAt = Date.now();
        console.error('❌ Error in periodic Signal receive:', (e as any)?.toString?.() || e);
    } finally {
        receiveInFlight = false;
    }
}, 5000);
