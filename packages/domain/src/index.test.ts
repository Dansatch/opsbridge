import { describe, expect, it } from 'vitest';
import {
  WORKFLOW_STAGES,
  advanceSimulation,
  createInitialSimulation,
  nextWorkflowStage,
} from './index.js';

describe('warehouse domain', () => {
  it('keeps the workflow in its declared order', () => {
    expect(WORKFLOW_STAGES.map((stage) => stage.id)).toEqual([
      'receiving',
      'picking',
      'packing',
      'dispatch',
    ]);
    expect(nextWorkflowStage('dispatch')).toBe('receiving');
  });

  it('advances orders deterministically', () => {
    const firstRun = advanceSimulation(createInitialSimulation());
    const secondRun = advanceSimulation(createInitialSimulation());

    expect(firstRun).toEqual(secondRun);
    expect(firstRun.clock.tick).toBe(1);
    expect(firstRun.orders[0]?.stage).toBe('picking');
    expect(firstRun.events[0]).toMatchObject({
      id: 'event-1-OB-10429',
      type: 'order.moved',
      from: 'receiving',
      to: 'picking',
      deviceId: 'RCV-SCN-01',
    });
    expect(firstRun.events[1]).toMatchObject({
      type: 'device.activity',
      deviceId: 'RCV-CAM-01',
      message: expect.stringContaining('captured OB-10429'),
    });
    expect(
      firstRun.devices.find(({ id }) => id === 'RCV-CAM-01')?.lastSeenTick,
    ).toBe(1);
  });

  it('records a dispatch when an order completes the route', () => {
    let state = createInitialSimulation();
    state = advanceSimulation(state);
    state = advanceSimulation(state);
    state = advanceSimulation(state);
    state = advanceSimulation(state);

    expect(state.orders[3]?.stage).toBe('receiving');
    expect(state.throughput.dispatchedOrders).toBe(39);
    expect(state.events[0]).toMatchObject({
      type: 'order.dispatched',
      orderId: 'OB-10436',
      destination: 'Birmingham',
    });
  });
});
