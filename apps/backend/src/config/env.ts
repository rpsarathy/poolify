import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env for local dev; on Render, env vars are set in the dashboard
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // Also check working directory

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  MAPBOX_TOKEN: z.string().optional(),
  API_URL: z.string().url().optional(), // Backend's own public URL (for OAuth callback)
  CLIENT_URL: z.string().url().default('http://localhost:8081'),
  PORT: z.coerce.number().default(3000),
  MATCHING_PROVIDER: z.enum(['geo', 'ai']).default('geo'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
