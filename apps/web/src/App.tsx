import {
  FAILURE_SCENARIOS,
  SIMULATION_TICK_MS,
  WORKFLOW_STAGES,
  describeEvent,
  getStageIndex,
  type DeviceType,
} from '@opsbridge/domain';
import { useMemo, useState, type CSSProperties } from 'react';
import { useLiveSimulation } from './useLiveSimulation';
import { Warehouse } from './Warehouse';

function activityTime(ticks: number) {
  if (ticks === 0) return 'now';
  return `${Math.round((SIMULATION_TICK_MS * ticks) / 1000)}s ago`;
}

const deviceTypeLabels: Record<DeviceType, string> = {
  barcode_scanner: 'Barcode scanner',
  camera: 'Operations camera',
  label_printer: 'Label printer',
  handheld_terminal: 'Handheld terminal',
};

const shiftCopy = {
  day: {
    eyebrow: 'Synthetic operations · Day shift',
    headline: 'A warehouse with somewhere to be.',
    healthy: 'Everything is moving nicely.',
  },
  night: {
    eyebrow: 'Synthetic operations · Night shift',
    headline: 'The lights are low. The standards are not.',
    healthy: 'Night crew steady. Even the printer is behaving.',
  },
} as const;

export function App() {
  const {
    acknowledgeIncident,
    changeShift,
    connection,
    recoverIncident,
    simulation,
    triggerFailure,
  } = useLiveSimulation();
  const [selectedOrderId, setSelectedOrderId] = useState('OB-10431');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>();
  const [troubleOpen, setTroubleOpen] = useState(false);

  const selectedOrder = useMemo(
    () =>
      simulation.orders.find((order) => order.id === selectedOrderId) ??
      simulation.orders[0],
    [selectedOrderId, simulation.orders],
  );
  const onlineDevices = simulation.devices.filter(
    (device) => device.status === 'online',
  ).length;
  const selectedDevice = simulation.devices.find(
    (device) => device.id === selectedDeviceId,
  );
  const selectedDeviceEvents = selectedDevice
    ? simulation.events.filter((event) => event.deviceId === selectedDevice.id)
    : [];
  const activeIncidents = simulation.incidents.filter(
    (incident) => incident.status !== 'resolved',
  );
  const activeIncident =
    activeIncidents.find((incident) => incident.status === 'open') ??
    activeIncidents[0];
  const activeIncidentScenario = activeIncident
    ? FAILURE_SCENARIOS.find(({ id }) => id === activeIncident.failureId)
    : undefined;
  const offlineDevices = simulation.devices.filter(
    (device) => device.status === 'offline',
  );
  const degradedDevices = simulation.devices.filter(
    (device) => device.status === 'degraded',
  );
  const operationMessage = offlineDevices.length
    ? `${offlineDevices[0]?.name} has stopped. The floor has noticed.`
    : degradedDevices.length
      ? `${degradedDevices[0]?.name} is struggling, but still trying.`
      : shiftCopy[simulation.shift].healthy;

  return (
    <main className={`app-shell shift-${simulation.shift}`}>
      <header className="topbar">
        <a className="brand" href="/" aria-label="OpsBridge home">
          <span className="brand-mark" aria-hidden="true" />
          OpsBridge
        </a>

        <div className="shift-switch" aria-label="Current warehouse shift">
          <button
            aria-pressed={simulation.shift === 'day'}
            disabled={connection !== 'live'}
            onClick={() => changeShift('day')}
            type="button"
          >
            ☀ Day shift
          </button>
          <button
            aria-pressed={simulation.shift === 'night'}
            disabled={connection !== 'live'}
            onClick={() => changeShift('night')}
            type="button"
          >
            ☾ Night shift
          </button>
        </div>

        <div className="live-status">
          <i className={connection} />{' '}
          {connection === 'live' ? 'Live from server' : 'Reconnecting'}
        </div>
        <button
          aria-expanded={troubleOpen}
          className="trouble-button"
          onClick={() => setTroubleOpen((open) => !open)}
          type="button"
        >
          Cause some trouble
        </button>
      </header>

      {troubleOpen ? (
        <section className="trouble-drawer" aria-label="Failure scenarios">
          <div>
            <span>Failure drill</span>
            <strong>What should misbehave?</strong>
            <p>
              Pick a synthetic fault and watch the floor react in real time.
            </p>
          </div>
          <div className="failure-options">
            {FAILURE_SCENARIOS.map((scenario) => {
              const device = simulation.devices.find(
                ({ id }) => id === scenario.deviceId,
              );
              const active = device?.status === scenario.status;
              const deviceIncident = activeIncidents.find(
                (incident) => incident.deviceId === scenario.deviceId,
              );

              return (
                <button
                  disabled={Boolean(deviceIncident) || connection !== 'live'}
                  key={scenario.id}
                  onClick={() => {
                    if (!triggerFailure(scenario.id)) return;
                    setSelectedDeviceId(scenario.deviceId);
                    setTroubleOpen(false);
                  }}
                  type="button"
                >
                  <span>
                    {deviceIncident
                      ? 'Incident already open'
                      : active
                        ? 'Already happening'
                        : scenario.label}
                  </span>
                  <small>{scenario.detail}</small>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="summary" aria-label="Operational summary">
        <div>
          <strong>{simulation.throughput.dispatchedOrders}</strong>
          <span>orders dispatched</span>
        </div>
        <div>
          <strong>
            {onlineDevices}/{simulation.devices.length}
          </strong>
          <span>devices online</span>
        </div>
        <div>
          <strong>{simulation.orders.length}</strong>
          <span>orders on floor</span>
        </div>
        <div className={activeIncidents.length ? 'summary-alert' : ''}>
          <strong>{activeIncidents.length}</strong>
          <span>active incidents</span>
        </div>
        <p>{operationMessage}</p>
      </section>

      <section className="floor" aria-labelledby="floor-title">
        <div className="floor-heading">
          <div>
            <p className="eyebrow">{shiftCopy[simulation.shift].eyebrow}</p>
            <h1 id="floor-title">{shiftCopy[simulation.shift].headline}</h1>
          </div>
          <p>
            Pick a parcel. Meet its journey.
            <span className="mobile-hint"> Swipe the floor to explore →</span>
          </p>
        </div>

        <div className="route" aria-label="Warehouse workflow">
          <Warehouse />
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
                onClick={() => {
                  setSelectedOrderId(order.id);
                  setSelectedDeviceId(undefined);
                }}
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
            const stageDevices = simulation.devices.filter(
              (candidate) => candidate.stage === stage.id,
            );
            const activeFailure = FAILURE_SCENARIOS.find((scenario) => {
              const failedDevice = stageDevices.find(
                ({ id }) => id === scenario.deviceId,
              );
              return failedDevice?.status === scenario.status;
            });

            return (
              <article
                className={`station station-${index} ${activeFailure ? 'has-trouble' : ''}`}
                key={stage.id}
              >
                <div className="station-index">0{index + 1}</div>
                <span
                  className={`device-light ${device?.status ?? 'offline'}`}
                  aria-label={`Device ${device?.status ?? 'offline'}`}
                />
                <h2>{stage.name}</h2>
                <p>{activeFailure ? 'Needs a little help' : 'Ready to roll'}</p>
                <div className="station-devices">
                  {stageDevices.map((stageDevice) => (
                    <button
                      aria-label={`Inspect ${stageDevice.name}`}
                      aria-pressed={selectedDeviceId === stageDevice.id}
                      key={stageDevice.id}
                      onClick={() => setSelectedDeviceId(stageDevice.id)}
                      className={`equipment equipment-${stageDevice.type}`}
                      type="button"
                    >
                      <span className="equipment-shape" aria-hidden="true">
                        <b />
                      </span>
                      <i className={stageDevice.status} />
                      {stageDevice.id}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        {activeIncident ? (
          <aside
            className={`incident-focus severity-${activeIncident.severity} is-${activeIncident.status}`}
            aria-live="assertive"
          >
            <div>
              <span className="focus-label">Incident detected</span>
              <strong>{activeIncident.id}</strong>
            </div>
            <div>
              <span>Priority</span>
              <strong className="incident-severity">
                {activeIncident.severity}
              </strong>
            </div>
            <div>
              <span>Equipment</span>
              <strong>{activeIncident.deviceId}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong className="incident-status">
                {activeIncident.status}
              </strong>
            </div>
            <div className="incident-summary">
              <span>
                {activeIncident.status === 'acknowledged'
                  ? 'Suggested recovery'
                  : 'What OpsBridge found'}
              </span>
              <strong>
                {activeIncident.status === 'acknowledged'
                  ? activeIncidentScenario?.recoveryInstruction
                  : activeIncident.summary}
              </strong>
              <small>
                {activeIncident.status === 'acknowledged'
                  ? 'Apply this action to restore the equipment.'
                  : `Detected ${Math.max(0, simulation.clock.tick - activeIncident.openedAtTick) * (SIMULATION_TICK_MS / 1000)}s ago`}
              </small>
            </div>
            <button
              disabled={connection !== 'live'}
              onClick={() => {
                if (activeIncident.status === 'open') {
                  acknowledgeIncident(activeIncident.id);
                } else {
                  recoverIncident(activeIncident.id);
                }
              }}
              type="button"
            >
              {activeIncident.status === 'open'
                ? 'Acknowledge incident'
                : (activeIncidentScenario?.recoveryLabel ?? 'Apply recovery')}
            </button>
          </aside>
        ) : selectedDevice ? (
          <aside className="order-focus device-focus" aria-live="polite">
            <div>
              <span className="focus-label">Inspecting</span>
              <strong>{selectedDevice.id}</strong>
            </div>
            <div>
              <span>Equipment</span>
              <strong>{deviceTypeLabels[selectedDevice.type]}</strong>
            </div>
            <div>
              <span>Health</span>
              <strong className={`health-${selectedDevice.status}`}>
                {selectedDevice.status}
              </strong>
            </div>
            <div>
              <span>Last report</span>
              <strong>
                {selectedDevice.lastSeenTick === 0
                  ? 'Waiting for activity'
                  : `${Math.max(0, simulation.clock.tick - selectedDevice.lastSeenTick) * (SIMULATION_TICK_MS / 1000)}s ago`}
              </strong>
            </div>
            <div className="device-event-list">
              <span>Recent device activity</span>
              <strong>
                {selectedDeviceEvents[0]
                  ? describeEvent(selectedDeviceEvents[0])
                  : `${selectedDevice.name} is online and waiting politely.`}
              </strong>
              {selectedDeviceEvents.slice(1, 3).map((event) => (
                <small key={event.id}>{describeEvent(event)}</small>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelectedDeviceId(undefined)}
            >
              Back to the parcel →
            </button>
          </aside>
        ) : selectedOrder ? (
          <aside className="order-focus" aria-live="polite">
            <div>
              <span className="focus-label">Following</span>
              <strong>{selectedOrder.id}</strong>
            </div>
            <div
              className="parcel-preview"
              style={
                { '--parcel-colour': selectedOrder.colour } as CSSProperties
              }
              aria-hidden="true"
            >
              <span>↗</span>
            </div>
            <ol className="journey" aria-label="Order journey">
              {WORKFLOW_STAGES.map((stage, index) => (
                <li
                  key={stage.id}
                  className={
                    index === getStageIndex(selectedOrder.stage)
                      ? 'current'
                      : index < getStageIndex(selectedOrder.stage)
                        ? 'complete'
                        : ''
                  }
                >
                  <i>
                    {index < getStageIndex(selectedOrder.stage)
                      ? '✓'
                      : index + 1}
                  </i>
                  <div>
                    <strong>{stage.name}</strong>
                    <small>
                      {index === getStageIndex(selectedOrder.stage)
                        ? 'Here, making progress.'
                        : index < getStageIndex(selectedOrder.stage)
                          ? 'All sorted.'
                          : 'Coming up next.'}
                    </small>
                  </div>
                </li>
              ))}
            </ol>
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
        {simulation.events.slice(0, 3).map((event) => (
          <p key={event.id}>
            <time>{activityTime(simulation.clock.tick - event.tick)}</time>{' '}
            {describeEvent(event)}
          </p>
        ))}
      </footer>

      <div className="project-note">
        <p>
          Original synthetic demo · No customer data or proprietary workflows
        </p>
        <a
          href="https://github.com/Dansatch/opsbridge"
          rel="noreferrer"
          target="_blank"
        >
          View the engineering behind it ↗
        </a>
      </div>
    </main>
  );
}
