import postgres from 'postgres';
import { env } from '@/lib/env';

/**
 * Singleton Postgres client.
 * - Kalau DATABASE_URL kosong → `db = null` → fitur DB di-skip (graceful).
 * - Di Vercel, instance di-cache di module scope (per warm container).
 */
export const db = env.DATABASE_URL
  ? postgres(env.DATABASE_URL, {
      max: 5,               // kecil, karena serverless bikin banyak koneksi
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,       // penting untuk Neon pooler (pgbouncer)
    })
  : null;

export const isDbEnabled = db !== null;

export function requireDb() {
  if (!db) throw new Error('DATABASE_URL belum diset.');
  return db;
}
