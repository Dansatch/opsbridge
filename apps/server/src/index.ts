import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const app = buildApp({ serveWeb: process.env.NODE_ENV === 'production' });

try {
  await app.listen({ host: '0.0.0.0', port });

  let closing = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, 'Shutting down cleanly');
    await app.close();
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
