import { WebSocketServer } from 'ws';
import { Server } from 'http';

let wss: WebSocketServer;

export function setupWebSocket(server: Server) {
    wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('📡 WebSocket client connected');

        ws.on('close', () => {
            console.log('❌ WebSocket client disconnected');
        });
    });
}

export function broadcastMessage(message: any) {
    if (!wss) return;

    const data = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(data);
        }
    });
}
