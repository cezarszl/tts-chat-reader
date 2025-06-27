import express from 'express';
import cors from 'cors';
import routes from './routes';
import './whatsapp';
import * as dotenv from 'dotenv';
import { setupWebSocket } from './ws';
import { createServer } from 'http';
import { receiveMessages } from './signal/service';

dotenv.config();

const baseUrl = process.env.API_BASE_URL;
const port = process.env.BACKEND_PORT;
const MY_NUMBER = process.env.SIGNAL_PHONE_NUMBER!;

export const SIGNAL_NUMBER = MY_NUMBER;

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', routes);

const server = createServer(app);
setupWebSocket(server);

server.listen(port, () => {
    console.log(`🚀 Backend running at ${baseUrl}:${port}`);
});

setInterval(async () => {
    try {
        await receiveMessages(SIGNAL_NUMBER);
    } catch (err) {
        console.error('❌ Error in periodic Signal receive:', err);
    }
}, 5000);
