import { WebSocket } from 'ws';

// Supports multiple tabs/devices per user
const registry = new Map<string, Set<WebSocket>>();

export const ConnectionRegistry = {
  add(userId: string, ws: WebSocket): void {
    if (!registry.has(userId)) {
      registry.set(userId, new Set());
    }
    registry.get(userId)!.add(ws);
  },

  remove(userId: string, ws: WebSocket): void {
    const sockets = registry.get(userId);
    if (!sockets) return;
    sockets.delete(ws);
    if (sockets.size === 0) registry.delete(userId);
  },

  broadcast(userId: string, event: object): void {
    const sockets = registry.get(userId);
    if (!sockets) return;
    const msg = JSON.stringify(event);
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    });
  },

  size(): number {
    let total = 0;
    registry.forEach((sockets) => { total += sockets.size; });
    return total;
  },
};
