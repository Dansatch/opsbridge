import { describe, expect, it } from 'vitest';
import {
  FAILURE_SCENARIOS,
  WORKFLOW_STAGES,
  acknowledgeIncident,
  advanceSimulation,
  createInitialSimulation,
  recoverIncident,
  triggerFailure,
  type SimulationState,
} from './index.js';

function expectValidState(state: SimulationState) {
  const stageIds = new Set(WORKFLOW_STAGES.map(({ id }) => id));
  const orderIds = state.orders.map(({ id }) => id);
  const deviceIds = state.devices.map(({ id }) => id);

  expect(new Set(orderIds).size).toBe(orderIds.length);
  expect(new Set(deviceIds).size).toBe(deviceIds.length);
  expect(state.orders.every(({ stage }) => stageIds.has(stage))).toBe(true);
  expect(
    state.devices.every(
      ({ lastSeenTick }) =>
        lastSeenTick >= 0 && lastSeenTick <= state.clock.tick,
    ),
  ).toBe(true);
  expect(state.events.length).toBeLessThanOrEqual(50);
  expect(new Set(state.events.map(({ id }) => id)).size).toBe(
    state.events.length,
  );
}

describe('simulation reliability', () => {
  it('keeps its invariants through five hundred live ticks', () => {
    let state = createInitialSimulation();

    for (let tick = 1; tick <= 500; tick += 1) {
      state = advanceSimulation(state);
      expect(state.clock.tick).toBe(tick);
      expectValidState(state);
    }

    expect(state.orders).toHaveLength(4);
    expect(state.devices).toHaveLength(8);
    expect(state.throughput.dispatchedOrders).toBe(163);
  });

  it.each(FAILURE_SCENARIOS)(
    'detects and recovers the $id drill without losing warehouse state',
    (scenario) => {
      const initial = createInitialSimulation();
      const failed = triggerFailure(initial, scenario.id);
      const incident = failed.incidents[0];

      expect(incident).toMatchObject({
        failureId: scenario.id,
        deviceId: scenario.deviceId,
        status: 'open',
      });
      expect(failed.orders).toEqual(initial.orders);

      const acknowledged = acknowledgeIncident(failed, incident?.id ?? '');
      const recovered = recoverIncident(acknowledged, incident?.id ?? '');

      expect(
        recovered.devices.find(({ id }) => id === scenario.deviceId)?.status,
      ).toBe('online');
      expect(recovered.incidents[0]?.status).toBe('resolved');
      expect(recovered.orders).toEqual(initial.orders);
      expectValidState(recovered);
    },
  );

  it('keeps unaffected orders moving while one station is offline', () => {
    let state = triggerFailure(createInitialSimulation(), 'printer_jam');

    for (let tick = 0; tick < 20; tick += 1) {
      state = advanceSimulation(state);
    }

    expect(state.clock.tick).toBe(20);
    expect(state.throughput.dispatchedOrders).toBeGreaterThan(38);
    expect(
      state.events.some(
        (event) =>
          event.type === 'device.activity' &&
          event.deviceId === 'PKG-PRN-01' &&
          event.message.includes('waiting at Packing'),
      ),
    ).toBe(true);
    expectValidState(state);
  });
});
