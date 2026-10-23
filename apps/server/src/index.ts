import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 3000);
const app = buildApp({ serveWeb: process.env.NODE_ENV === 'production' });

try {
  await app.listen({ host: '0.0.0.0', port });
} catch (error) {
  app.log.error(error);
  await app.close();
  process.exitCode = 1;
}
