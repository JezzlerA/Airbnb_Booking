import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './config/db';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

async function migrate() {
  const files = await readdir(migrationsDir);
  const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort();

  for (const file of sqlFiles) {
    const sql = await readFile(join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    console.log(`Applied migration ${file}`);
  }

  console.log('Database migration completed.');
}

migrate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
