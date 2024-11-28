// server/services/websocket.service.ts
import type { H3Event } from 'h3';
import { WebSocketServer } from 'ws';

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<any> = new Set();

  initialize(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);

      ws.on('message', (message: string) => {
        this.broadcast(message);
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  broadcast(message: string) {
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(message);
      }
    });
  }
}

export const webSocketService = new WebSocketService();
