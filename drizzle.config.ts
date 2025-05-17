import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, './src-tauri/.env') });

const url = z.string().url().parse(process.env.DATABASE_URL);

export default defineConfig({
  dbCredentials: { url },
  dialect: 'postgresql',
});
