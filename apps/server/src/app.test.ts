import { afterEach, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';
import { SimulationEngine } from './simulation.js';

const apps: ReturnType<typeof buildApp>[] = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('OpsBridge server', () => {
  it('reports when the service is ready', async () => {
    const app = buildApp({ startSimulation: false });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/api/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ service: 'opsbridge', status: 'ready' });
  });

  it('serves the current simulation as an HTTP snapshot', async () => {
    const app = buildApp({ startSimulation: false });
    apps.push(app);

    const response = await app.inject({
      method: 'GET',
      url: '/api/simulation',
    });

    expect(response.statusCode).toBe(200);
    const snapshot = response.json();
    expect(snapshot.clock).toMatchObject({ tick: 0 });
    expect(snapshot.orders[0]).toMatchObject({
      id: 'OB-10429',
      stage: 'receiving',
    });
    expect(snapshot.devices[0]).toMatchObject({
      id: 'RCV-SCN-01',
      status: 'online',
    });
  });

  it('remembers operational events in SQLite', async () => {
    const simulation = new SimulationEngine();
    const app = buildApp({ simulation, startSimulation: false });
    apps.push(app);

    simulation.advance();
    simulation.advance();

    const response = await app.inject({
      method: 'GET',
      url: '/api/events?limit=4',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      total: 7,
      events: [
        { id: 'event-2-OB-10431', tick: 2, type: 'order.moved' },
        { tick: 2, type: 'device.activity', deviceId: 'PK-SCN-03' },
        { id: 'event-1-OB-10429', tick: 1, type: 'order.moved' },
        { tick: 1, type: 'device.activity', deviceId: 'RCV-CAM-01' },
      ],
    });
  });

  it('streams snapshots when the server simulation advances', async () => {
    const simulation = new SimulationEngine();
    const app = buildApp({ simulation, startSimulation: false });
    apps.push(app);
    await app.ready();

    const socket = await app.injectWS('/api/live');
    const messages: string[] = [];
    socket.on('message', (data) => messages.push(data.toString()));

    socket.send(JSON.stringify({ type: 'simulation.subscribe' }));
    await expect.poll(() => messages.length).toBe(1);
    expect(JSON.parse(messages[0] ?? '{}')).toMatchObject({
      type: 'simulation.snapshot',
      state: { clock: { tick: 0 } },
    });

    simulation.advance();
    await expect.poll(() => messages.length).toBe(2);
    expect(JSON.parse(messages[1] ?? '{}')).toMatchObject({
      type: 'simulation.snapshot',
      state: { clock: { tick: 1 } },
    });

    socket.send(
      JSON.stringify({
        type: 'simulation.trigger_failure',
        failureId: 'printer_jam',
      }),
    );
    await expect.poll(() => messages.length).toBe(3);
    expect(JSON.parse(messages[2] ?? '{}')).toMatchObject({
      type: 'simulation.snapshot',
      state: {
        devices: expect.arrayContaining([
          expect.objectContaining({ id: 'PKG-PRN-01', status: 'offline' }),
        ]),
        incidents: [expect.objectContaining({ id: 'INC-001', status: 'open' })],
        events: expect.arrayContaining([
          expect.objectContaining({
            type: 'device.status_changed',
            deviceId: 'PKG-PRN-01',
          }),
        ]),
      },
    });

    socket.send(
      JSON.stringify({
        type: 'incident.acknowledge',
        incidentId: 'INC-001',
      }),
    );
    await expect.poll(() => messages.length).toBe(4);
    expect(JSON.parse(messages[3] ?? '{}')).toMatchObject({
      type: 'simulation.snapshot',
      state: {
        incidents: [
          expect.objectContaining({ id: 'INC-001', status: 'acknowledged' }),
        ],
      },
    });

    socket.send(
      JSON.stringify({
        type: 'incident.recover',
        incidentId: 'INC-001',
      }),
    );
    await expect.poll(() => messages.length).toBe(5);
    expect(JSON.parse(messages[4] ?? '{}')).toMatchObject({
      type: 'simulation.snapshot',
      state: {
        devices: expect.arrayContaining([
          expect.objectContaining({ id: 'PKG-PRN-01', status: 'online' }),
        ]),
        incidents: [
          expect.objectContaining({ id: 'INC-001', status: 'resolved' }),
        ],
      },
    });

    socket.terminate();
  });
});
