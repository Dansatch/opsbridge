import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import type {
  SimulationClientMessage,
  SimulationServerMessage,
} from '@opsbridge/domain';
import Fastify from 'fastify';
import { fileURLToPath } from 'node:url';
import { SimulationEngine } from './simulation.js';

type AppOptions = {
  serveWeb?: boolean;
  simulation?: SimulationEngine;
  startSimulation?: boolean;
};

function isSubscribeMessage(value: unknown): value is SimulationClientMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'simulation.subscribe'
  );
}

export function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });
  const simulation = options.simulation ?? new SimulationEngine();
  const shouldStartSimulation = options.startSimulation ?? true;

  void app.register(fastifyWebsocket);

  app.addHook('onReady', async () => {
    if (shouldStartSimulation) simulation.start();
  });

  app.addHook('onClose', async () => {
    simulation.stop();
  });

  app.get('/api/health', async () => ({
    service: 'opsbridge',
    status: 'ready',
  }));

  app.get('/api/simulation', async () => simulation.getState());

  void app.register(async (liveApp) => {
    liveApp.get('/api/live', { websocket: true }, (socket) => {
      let subscribed = false;
      const sendSnapshot = (state = simulation.getState()) => {
        if (socket.readyState !== socket.OPEN) return;
        const message: SimulationServerMessage = {
          type: 'simulation.snapshot',
          state,
        };
        socket.send(JSON.stringify(message));
      };
      const unsubscribe = simulation.subscribe((state) => {
        if (subscribed) sendSnapshot(state);
      });

      socket.on('message', (data) => {
        try {
          const message: unknown = JSON.parse(data.toString());
          if (!isSubscribeMessage(message)) return;
          subscribed = true;
          sendSnapshot();
        } catch {
          socket.close(1003, 'Expected a JSON message');
        }
      });
      socket.on('close', unsubscribe);
    });
  });

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
