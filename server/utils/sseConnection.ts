import { H3Event } from 'h3';

class SSEConnections {
  private connections: Map<string, H3Event> = new Map();

  addConnection(userId: string, event: H3Event) {
    this.connections.set(userId, event);
  }

  removeConnection(userId: string) {
    this.connections.delete(userId);
  }

  getConnection(userId: string): H3Event | undefined {
    return this.connections.get(userId);
  }

  getAllConnections(): Map<string, H3Event> {
    return this.connections;
  }

  isConnected(userId: string): boolean {
    return this.connections.has(userId);
  }
}

export const sseConnections = new SSEConnections();
