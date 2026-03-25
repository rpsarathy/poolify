export const CONFIG = {
  API_URL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:3000/ws',
  MAPBOX_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
} as const;
