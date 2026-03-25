import { WebSocketServer as WSSLibrary, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { verifyAccessToken } from '../utils/jwt';
import { ConnectionRegistry } from './ConnectionRegistry';
import { NotificationModel } from '../models/Notification.model';
import { WS_EVENTS } from './events';

export function attachWebSocketServer(server: import('http').Server): WSSLibrary {
  const wss = new WSSLibrary({ server, path: '/ws' });

  wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
    // Extract JWT from query string: /ws?token=<jwt>
    const query = parse(req.url ?? '', true).query;
    const token = typeof query.token === 'string' ? query.token : null;

    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }

    let userId: string;
    try {
      const payload = verifyAccessToken(token);
      userId = payload.sub;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    ConnectionRegistry.add(userId, ws);
    console.log(`[WS] User ${userId} connected. Total connections: ${ConnectionRegistry.size()}`);

    // Flush unread notifications on connect
    try {
      const unread = await NotificationModel.find({ userId, read: false })
        .sort({ createdAt: -1 })
        .limit(50);

      if (unread.length > 0) {
        ws.send(JSON.stringify({ type: WS_EVENTS.INIT, payload: unread }));
      }
    } catch (err) {
      console.error('[WS] Failed to flush notifications:', err);
    }

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as { type: string };
        if (msg.type === WS_EVENTS.PING) {
          ws.send(JSON.stringify({ type: WS_EVENTS.PONG }));
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      ConnectionRegistry.remove(userId, ws);
      console.log(`[WS] User ${userId} disconnected`);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Error for user ${userId}:`, err);
      ConnectionRegistry.remove(userId, ws);
    });
  });

  return wss;
}
