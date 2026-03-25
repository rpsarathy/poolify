import http from 'http';
import { env } from './config/env';
import { connectDB } from './config/database';
import { createApp } from './app';
import { attachWebSocketServer } from './realtime/WebSocketServer';

async function main() {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);
  attachWebSocketServer(server);

  server.listen(env.PORT, () => {
    console.log(`[SERVER] Poolify backend running on port ${env.PORT} (${env.NODE_ENV})`);
    console.log(`[SERVER] WebSocket available at ws://localhost:${env.PORT}/ws`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[SERVER] Shutting down...');
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('[SERVER] Fatal startup error:', err);
  process.exit(1);
});
