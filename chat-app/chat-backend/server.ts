import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatar: string;
  text: string;
  timestamp: string;
}

const clients: Set<WebSocket> = new Set();

wss.on('connection', (ws: WebSocket) => {
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);

  ws.on('message', (messageData: string) => {
    try {
      const parsedMessage: ChatMessage = JSON.parse(messageData.toString());

      // Broadcast the message to all connected clients (including sender for sync)
      const payload = JSON.stringify(parsedMessage);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    } catch (err) {
      console.error('Failed to parse message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});

console.log('WebSocket server running on ws://localhost:8080');