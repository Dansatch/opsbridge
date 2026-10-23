import {
  SIMULATION_TICK_MS,
  WORKFLOW_STAGES,
  describeEvent,
  getStageIndex,
} from '@opsbridge/domain';
import { useMemo, useState, type CSSProperties } from 'react';
import { useLiveSimulation } from './useLiveSimulation';

function activityTime(index: number) {
  if (index === 0) return 'now';
  return `−${Math.round((SIMULATION_TICK_MS * index) / 1000)}s`;
}

export function App() {
  const { connection, simulation } = useLiveSimulation();
  const [selectedOrderId, setSelectedOrderId] = useState('OB-10431');

  const selectedOrder = useMemo(
    () =>
      simulation.orders.find((order) => order.id === selectedOrderId) ??
      simulation.orders[0],
    [selectedOrderId, simulation.orders],
  );
  const onlineDevices = simulation.devices.filter(
    (device) => device.status === 'online',
  ).length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="OpsBridge home">
          <span className="brand-mark" aria-hidden="true" />
          OpsBridge
        </a>

        <div className="shift-switch" aria-label="Current warehouse shift">
          <span className="active">☀ Day shift</span>
          <span>☾ Night shift</span>
        </div>

        <div className="live-status">
          <i className={connection} />{' '}
          {connection === 'live' ? 'Live from server' : 'Reconnecting'}
        </div>
        <button className="trouble-button" type="button">
          Cause some trouble
        </button>
      </header>

      <section className="summary" aria-label="Operational summary">
        <div>
          <strong>{simulation.throughput.dispatchedOrders}</strong>
          <span>orders/hour</span>
        </div>
        <div>
          <strong>
            {onlineDevices}/{simulation.devices.length}
          </strong>
          <span>devices online</span>
        </div>
        <div>
          <strong>{simulation.orders.length}</strong>
          <span>orders moving</span>
        </div>
        <p>Everything is moving nicely.</p>
      </section>

      <section className="floor" aria-labelledby="floor-title">
        <div className="floor-heading">
          <div>
            <p className="eyebrow">Synthetic operations · Day shift</p>
            <h1 id="floor-title">A warehouse with somewhere to be.</h1>
          </div>
          <p>
            <span className="floor-status-dot" /> Server tick{' '}
            {simulation.clock.tick}
          </p>
        </div>

        <div className="route" aria-label="Warehouse workflow">
          <div className="conveyor" aria-hidden="true" />
          {simulation.orders.map((order, orderIndex) => {
            const stage = WORKFLOW_STAGES.find(({ id }) => id === order.stage);
            const stageIndex = getStageIndex(order.stage);
            const ordersAtStage = simulation.orders.filter(
              (candidate) => candidate.stage === order.stage,
            );
            const lane = simulation.orders
              .slice(0, orderIndex)
              .filter((candidate) => candidate.stage === order.stage).length;
            const parcelOffset = (lane - (ordersAtStage.length - 1) / 2) * 54;

            return (
              <button
                aria-label={`Follow ${order.id}, currently at ${stage?.name ?? order.stage}`}
                aria-pressed={selectedOrderId === order.id}
                className={`parcel parcel-${stageIndex} ${selectedOrderId === order.id ? 'selected' : ''}`}
                key={order.id}
                onClick={() => setSelectedOrderId(order.id)}
                style={
                  {
                    '--parcel-colour': order.colour,
                    '--parcel-offset': `${parcelOffset}px`,
                  } as CSSProperties
                }
                type="button"
              >
                <span>{order.id}</span>
              </button>
            );
          })}
          {WORKFLOW_STAGES.map((stage, index) => {
            const device = simulation.devices.find(
              ({ id }) => id === stage.primaryDeviceId,
            );

            return (
              <article className="station" key={stage.id}>
                <div className="station-index">0{index + 1}</div>
                <span
                  className={`device-light ${device?.status ?? 'offline'}`}
                  aria-label={`Device ${device?.status ?? 'offline'}`}
                />
                <h2>{stage.name}</h2>
                <p>{stage.note}</p>
                <code>{stage.primaryDeviceId}</code>
              </article>
            );
          })}
        </div>

        {selectedOrder ? (
          <aside className="order-focus" aria-live="polite">
            <div>
              <span className="focus-label">Following</span>
              <strong>{selectedOrder.id}</strong>
            </div>
            <div>
              <span>Now at</span>
              <strong>
                {WORKFLOW_STAGES.find(({ id }) => id === selectedOrder.stage)
                  ?.name ?? selectedOrder.stage}
              </strong>
            </div>
            <div>
              <span>Inside</span>
              <strong>
                {selectedOrder.items}{' '}
                {selectedOrder.items === 1 ? 'item' : 'items'}
              </strong>
            </div>
            <div>
              <span>Heading to</span>
              <strong>{selectedOrder.destination}</strong>
            </div>
            <p>Stick with it—the next scan will move it along.</p>
          </aside>
        ) : null}
      </section>

      <footer className="activity">
        <div>
          <span className="pulse" /> Recent activity
        </div>
        {simulation.events.slice(0, 3).map((event, index) => (
          <p key={event.id}>
            <time>{activityTime(index)}</time> {describeEvent(event)}
          </p>
        ))}
      </footer>
    </main>
  );
}
