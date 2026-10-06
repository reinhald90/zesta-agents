import 'dotenv/config';
import { runMigrations } from '@/database/migrations/runner';

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[migrate] gagal:', err);
    process.exit(1);
  });
