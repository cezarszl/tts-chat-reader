import express from 'express';
import cors from 'cors';
import routes from './routes';
import './whatsapp';
import * as dotenv from "dotenv";
import { setupWebSocket } from './ws';
import { createServer } from 'http';
dotenv.config();

const baseUrl = process.env.API_BASE_URL;

const app = express();
const port = process.env.BACKEND_PORT;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

const server = createServer(app);
setupWebSocket(server);
server.listen(port, () => {
    console.log(`🚀 Backend running at ${baseUrl}:${port}`);
});
