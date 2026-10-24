import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import type {
  SimulationClientMessage,
  SimulationServerMessage,
} from '@opsbridge/domain';
import Fastify from 'fastify';
import { fileURLToPath } from 'node:url';
import { OperationalEventStore } from './event-store.js';
import { SimulationEngine } from './simulation.js';

type AppOptions = {
  serveWeb?: boolean;
  eventStore?: OperationalEventStore;
  simulation?: SimulationEngine;
  startSimulation?: boolean;
};

function isSubscribeMessage(value: unknown): value is SimulationClientMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value.type === 'simulation.subscribe' ||
      (value.type === 'simulation.trigger_failure' &&
        'failureId' in value &&
        typeof value.failureId === 'string'))
  );
}

export function buildApp(options: AppOptions = {}) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });
  const simulation = options.simulation ?? new SimulationEngine();
  const eventStore =
    options.eventStore ??
    new OperationalEventStore(
      process.env.NODE_ENV === 'test'
        ? ':memory:'
        : (process.env.SQLITE_PATH ?? 'data/opsbridge.db'),
    );
  const shouldStartSimulation = options.startSimulation ?? true;
  if (eventStore.count() === 0) {
    eventStore.recordMany(simulation.getState().events);
  }
  let latestEventId = simulation.getState().events[0]?.id;
  const stopPersisting = simulation.subscribe((state) => {
    const latestEvent = state.events[0];
    if (!latestEvent || latestEvent.id === latestEventId) return;
    const previousEventIndex = state.events.findIndex(
      ({ id }) => id === latestEventId,
    );
    const newEvents = state.events.slice(
      0,
      previousEventIndex === -1 ? 1 : previousEventIndex,
    );
    eventStore.recordMany(newEvents);
    latestEventId = latestEvent.id;
  });

  void app.register(fastifyWebsocket);

  app.addHook('onReady', async () => {
    if (shouldStartSimulation) simulation.start();
  });

  app.addHook('onClose', async () => {
    simulation.stop();
    stopPersisting();
    eventStore.close();
  });

  app.get('/api/health', async () => ({
    service: 'opsbridge',
    status: 'ready',
  }));

  app.get('/api/simulation', async () => simulation.getState());

  app.get<{ Querystring: { limit?: string } }>(
    '/api/events',
    async (request) => {
      const requestedLimit = Number(request.query.limit ?? 25);
      const limit = Number.isFinite(requestedLimit) ? requestedLimit : 25;

      return {
        events: eventStore.recent(limit),
        total: eventStore.count(),
      };
    },
  );

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
          if (message.type === 'simulation.subscribe') {
            subscribed = true;
            sendSnapshot();
          } else {
            simulation.triggerFailure(message.failureId);
          }
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
