import {
  createInitialSimulation,
  type SimulationClientMessage,
  type SimulationServerMessage,
  type SimulationState,
} from '@opsbridge/domain';
import { useEffect, useState } from 'react';

export type LiveConnection = 'connecting' | 'live' | 'reconnecting';

function isSimulationState(value: unknown): value is SimulationState {
  return (
    typeof value === 'object' &&
    value !== null &&
    'clock' in value &&
    'orders' in value &&
    'devices' in value &&
    Array.isArray(value.orders) &&
    Array.isArray(value.devices)
  );
}

function isSnapshotMessage(value: unknown): value is SimulationServerMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'simulation.snapshot' &&
    'state' in value &&
    isSimulationState(value.state)
  );
}

export function useLiveSimulation() {
  const [simulation, setSimulation] = useState(createInitialSimulation);
  const [connection, setConnection] = useState<LiveConnection>('connecting');

  useEffect(() => {
    let disposed = false;
    let reconnectTimer: number | undefined;
    let socket: WebSocket | undefined;

    const applySnapshot = (value: unknown) => {
      if (isSimulationState(value)) setSimulation(value);
    };

    const loadHttpSnapshot = async () => {
      try {
        const response = await fetch('/api/simulation');
        if (response.ok) applySnapshot(await response.json());
      } catch {
        // The bundled initial state keeps the public demo useful while reconnecting.
      }
    };

    const connect = () => {
      if (disposed) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socket = new WebSocket(`${protocol}//${window.location.host}/api/live`);

      socket.addEventListener('open', () => {
        setConnection('live');
        const message: SimulationClientMessage = {
          type: 'simulation.subscribe',
        };
        socket?.send(JSON.stringify(message));
      });
      socket.addEventListener('message', (event) => {
        try {
          const message: unknown = JSON.parse(String(event.data));
          if (isSnapshotMessage(message)) setSimulation(message.state);
        } catch {
          socket?.close(1003, 'Invalid server message');
        }
      });
      socket.addEventListener('close', () => {
        if (disposed) return;
        setConnection('reconnecting');
        reconnectTimer = window.setTimeout(connect, 1_500);
      });
      socket.addEventListener('error', () => socket?.close());
    };

    void loadHttpSnapshot();
    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socket?.close(1000, 'Page closed');
    };
  }, []);

  return { connection, simulation };
}
