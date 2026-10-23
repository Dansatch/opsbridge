export const SIMULATION_TICK_MS = 3_600;

export const WORKFLOW_STAGES = [
  {
    id: 'receiving',
    name: 'Receiving',
    note: 'Ready for the next arrival',
    primaryDeviceId: 'RCV-SCN-01',
  },
  {
    id: 'picking',
    name: 'Picking',
    note: 'Three orders on the move',
    primaryDeviceId: 'PK-HHD-02',
  },
  {
    id: 'packing',
    name: 'Packing',
    note: 'Labels behaving themselves',
    primaryDeviceId: 'PKG-PRN-01',
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    note: 'Bay 2 is loading',
    primaryDeviceId: 'DSP-SCN-01',
  },
] as const;

export type WorkflowStageId = (typeof WORKFLOW_STAGES)[number]['id'];
export type Shift = 'day' | 'night';
export type DeviceType =
  'barcode_scanner' | 'camera' | 'label_printer' | 'handheld_terminal';
export type DeviceStatus = 'online' | 'degraded' | 'offline';
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';
export type IncidentSeverity = 'warning' | 'critical';

export type Order = {
  id: string;
  destination: string;
  items: number;
  colour: string;
  stage: WorkflowStageId;
};

export type Device = {
  id: string;
  name: string;
  type: DeviceType;
  stage: WorkflowStageId;
  status: DeviceStatus;
  lastSeenTick: number;
};

export type Incident = {
  id: string;
  deviceId: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  summary: string;
  openedAtTick: number;
  acknowledgedAtTick?: number;
  resolvedAtTick?: number;
};

type EventBase = {
  id: string;
  tick: number;
  deviceId: string;
};

export type OperationalEvent =
  | (EventBase & {
      type: 'order.moved';
      orderId: string;
      from: WorkflowStageId;
      to: WorkflowStageId;
    })
  | (EventBase & {
      type: 'order.dispatched';
      orderId: string;
      destination: string;
    })
  | (EventBase & {
      type: 'device.activity';
      message: string;
    })
  | (EventBase & {
      type: 'device.status_changed';
      from: DeviceStatus;
      to: DeviceStatus;
    })
  | (EventBase & {
      type: 'incident.opened';
      incidentId: string;
      severity: IncidentSeverity;
    })
  | (EventBase & {
      type: 'incident.acknowledged' | 'incident.resolved';
      incidentId: string;
    });

export type SimulationClock = {
  tick: number;
  tickDurationMs: number;
};

export type SimulationState = {
  clock: SimulationClock;
  shift: Shift;
  orders: Order[];
  devices: Device[];
  incidents: Incident[];
  events: OperationalEvent[];
  throughput: {
    dispatchedOrders: number;
  };
};

const initialOrders: Order[] = [
  {
    id: 'OB-10429',
    destination: 'Manchester',
    items: 3,
    colour: '#e7ae45',
    stage: 'receiving',
  },
  {
    id: 'OB-10431',
    destination: 'Bristol',
    items: 1,
    colour: '#8e78d7',
    stage: 'picking',
  },
  {
    id: 'OB-10434',
    destination: 'Leeds',
    items: 5,
    colour: '#4eb6c2',
    stage: 'packing',
  },
  {
    id: 'OB-10436',
    destination: 'Birmingham',
    items: 2,
    colour: '#e98262',
    stage: 'dispatch',
  },
];

const initialDevices: Device[] = [
  {
    id: 'RCV-SCN-01',
    name: 'Receiving scanner',
    type: 'barcode_scanner',
    stage: 'receiving',
    status: 'online',
    lastSeenTick: 0,
  },
  {
    id: 'RCV-CAM-01',
    name: 'Arrival camera',
    type: 'camera',
    stage: 'receiving',
    status: 'online',
    lastSeenTick: 0,
  },
  {
    id: 'PK-HHD-02',
    name: 'Picking handheld',
    type: 'handheld_terminal',
    stage: 'picking',
    status: 'online',
    lastSeenTick: 0,
  },
  {
    id: 'PK-SCN-03',
    name: 'Aisle scanner',
    type: 'barcode_scanner',
    stage: 'picking',
    status: 'online',
    lastSeenTick: 0,
  },
  {
    id: 'PKG-PRN-01',
    name: 'Packing label printer',
    type: 'label_printer',
    stage: 'packing',
    status: 'online',
    lastSeenTick: 0,
  },
  {
    id: 'PKG-CAM-02',
    name: 'Packing camera',
    type: 'camera',
    stage: 'packing',
    status: 'online',
    lastSeenTick: 0,
  },
  {
    id: 'DSP-SCN-01',
    name: 'Dispatch scanner',
    type: 'barcode_scanner',
    stage: 'dispatch',
    status: 'online',
    lastSeenTick: 0,
  },
  {
    id: 'DSP-HHD-01',
    name: 'Bay handheld',
    type: 'handheld_terminal',
    stage: 'dispatch',
    status: 'online',
    lastSeenTick: 0,
  },
];

const initialEvents: OperationalEvent[] = [
  {
    id: 'event-seed-3',
    tick: 0,
    type: 'order.moved',
    orderId: 'OB-10434',
    from: 'picking',
    to: 'packing',
    deviceId: 'PKG-PRN-01',
  },
  {
    id: 'event-seed-2',
    tick: -1,
    type: 'device.activity',
    deviceId: 'RCV-SCN-01',
    message: 'RCV-SCN-01 checked in',
  },
  {
    id: 'event-seed-1',
    tick: -2,
    type: 'device.activity',
    deviceId: 'PKG-PRN-01',
    message: 'Label printed first time. Lovely.',
  },
];

export function createInitialSimulation(): SimulationState {
  return {
    clock: { tick: 0, tickDurationMs: SIMULATION_TICK_MS },
    shift: 'day',
    orders: initialOrders.map((order) => ({ ...order })),
    devices: initialDevices.map((device) => ({ ...device })),
    incidents: [],
    events: initialEvents.map((event) => ({ ...event })),
    throughput: { dispatchedOrders: 38 },
  };
}

export function getStageIndex(stageId: WorkflowStageId) {
  return WORKFLOW_STAGES.findIndex((stage) => stage.id === stageId);
}

export function nextWorkflowStage(stageId: WorkflowStageId): WorkflowStageId {
  const currentIndex = getStageIndex(stageId);
  const nextIndex = (currentIndex + 1) % WORKFLOW_STAGES.length;
  return WORKFLOW_STAGES[nextIndex]?.id ?? WORKFLOW_STAGES[0].id;
}

export function describeEvent(event: OperationalEvent) {
  if (event.type === 'order.dispatched') {
    return `${event.orderId} left Dispatch. Safe travels.`;
  }

  if (event.type === 'order.moved') {
    const stage = WORKFLOW_STAGES.find(({ id }) => id === event.to);
    return `${event.orderId} reached ${stage?.name ?? event.to}`;
  }

  if (event.type === 'device.activity') return event.message;
  if (event.type === 'device.status_changed') {
    return `${event.deviceId} changed from ${event.from} to ${event.to}`;
  }
  if (event.type === 'incident.opened') {
    return `Incident ${event.incidentId} opened for ${event.deviceId}`;
  }
  if (event.type === 'incident.acknowledged') {
    return `Incident ${event.incidentId} acknowledged`;
  }

  return `Incident ${event.incidentId} resolved`;
}

export function advanceSimulation(state: SimulationState): SimulationState {
  const nextTick = state.clock.tick + 1;
  const orderIndex = state.clock.tick % state.orders.length;
  const movingOrder = state.orders[orderIndex];

  if (!movingOrder) {
    return { ...state, clock: { ...state.clock, tick: nextTick } };
  }

  const from = movingOrder.stage;
  const to = nextWorkflowStage(from);
  const stage = WORKFLOW_STAGES.find(({ id }) => id === from);
  const deviceId = stage?.primaryDeviceId ?? 'OPS-SYS-01';
  const dispatched = from === 'dispatch';
  const event: OperationalEvent = dispatched
    ? {
        id: `event-${nextTick}-${movingOrder.id}`,
        tick: nextTick,
        type: 'order.dispatched',
        orderId: movingOrder.id,
        destination: movingOrder.destination,
        deviceId,
      }
    : {
        id: `event-${nextTick}-${movingOrder.id}`,
        tick: nextTick,
        type: 'order.moved',
        orderId: movingOrder.id,
        from,
        to,
        deviceId,
      };

  return {
    ...state,
    clock: { ...state.clock, tick: nextTick },
    orders: state.orders.map((order, index) =>
      index === orderIndex ? { ...order, stage: to } : order,
    ),
    devices: state.devices.map((device) =>
      device.id === deviceId ? { ...device, lastSeenTick: nextTick } : device,
    ),
    events: [event, ...state.events].slice(0, 50),
    throughput: {
      dispatchedOrders:
        state.throughput.dispatchedOrders + (dispatched ? 1 : 0),
    },
  };
}
