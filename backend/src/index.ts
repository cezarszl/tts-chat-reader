import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import routes from './routes';
import path from 'path';
import './whatsapp';
import { setupWebSocket } from './ws';
import { createServer } from 'http';
import { receiveMessages, checkSignalReady } from './signal/';
import fs from 'fs';


const baseUrl = process.env.API_BASE_URL;
const port = process.env.BACKEND_PORT;
const MY_NUMBER = process.env.SIGNAL_PHONE_NUMBER!;

export const SIGNAL_NUMBER = MY_NUMBER;


const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const server = createServer(app);
setupWebSocket(server);

server.listen(port, () => {
    console.log(`🚀 Backend running at ${baseUrl}:${port}`);
});

checkSignalReady();

setInterval(async () => {
    try {
        await receiveMessages(SIGNAL_NUMBER);
    } catch (err) {
        console.error('❌ Error in periodic Signal receive:', err);
    }
}, 5000);
