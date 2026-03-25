import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { useNotificationsStore } from '../store/notifications.store';
import { CONFIG } from '../constants/config';
import type { WsEvent } from '@poolify/shared';

const PING_INTERVAL_MS = 30_000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addNotification, setNotifications } = useNotificationsStore();

  function connect() {
    if (!accessToken || !isAuthenticated) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${CONFIG.WS_URL}?token=${accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Start ping keepalive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, PING_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        const data: WsEvent = JSON.parse(event.data as string);
        if (data.type === 'notification') {
          addNotification(data.payload);
        } else if (data.type === 'init') {
          setNotifications(data.payload);
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      clearInterval(pingIntervalRef.current ?? undefined);
      wsRef.current = null;
    };

    ws.onerror = () => {
      ws.close();
    };
  }

  function disconnect() {
    clearInterval(pingIntervalRef.current ?? undefined);
    wsRef.current?.close();
    wsRef.current = null;
  }

  useEffect(() => {
    if (isAuthenticated && accessToken) connect();
    return disconnect;
  }, [isAuthenticated, accessToken]);

  // Reconnect when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') connect();
      else if (state === 'background') disconnect();
    });
    return () => sub.remove();
  }, [accessToken, isAuthenticated]);
}
