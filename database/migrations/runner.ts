import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { requireDb } from '@/database/client';

export async function runMigrations() {
  const sql = requireDb();
  const dir = path.join(process.cwd(), 'database', 'schema');

  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const files = (await readdir(dir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const id = file.replace(/\.sql$/, '');
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM schema_migrations WHERE id = ${id}
    `;
    if (existing.length > 0) {
      console.log(`[migrate] skip ${id} (sudah dijalankan)`);
      continue;
    }

    const content = await readFile(path.join(dir, file), 'utf8');
    console.log(`[migrate] applying ${id}...`);

    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`INSERT INTO schema_migrations (id) VALUES (${id})`;
    });
    console.log(`[migrate] ok ${id}`);
  }
  console.log('[migrate] selesai.');
}
