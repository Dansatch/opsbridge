import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { fileURLToPath } from 'node:url';

export function buildApp(options: { serveWeb?: boolean } = {}) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  app.get('/api/health', async () => ({
    service: 'opsbridge',
    status: 'ready',
  }));

  if (options.serveWeb) {
    const webRoot = fileURLToPath(new URL('../../web/dist', import.meta.url));
    void app.register(fastifyStatic, {
      root: webRoot,
      wildcard: false,
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url?.startsWith('/api/')) {
        return reply.code(404).send({ message: 'Route not found' });
      }

      return reply.sendFile('index.html');
    });
  }

  return app;
}
