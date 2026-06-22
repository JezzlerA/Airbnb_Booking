import 'dotenv/config';
import app from './app';
import { closeDb, pool } from './config/db';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log(`HavenShare API listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}. Shutting down gracefully.`);
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Graceful shutdown timed out. Forcing exit.');
    pool.end();
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
