import { useEffect, useMemo, useState, type CSSProperties } from 'react';

const stages = [
  {
    name: 'Receiving',
    note: 'Ready for the next arrival',
    device: 'RCV-SCN-01',
  },
  { name: 'Picking', note: 'Three orders on the move', device: 'PK-HHD-02' },
  { name: 'Packing', note: 'Labels behaving themselves', device: 'PKG-PRN-01' },
  { name: 'Dispatch', note: 'Bay 2 is loading', device: 'DSP-SCN-01' },
] as const;

type StageIndex = 0 | 1 | 2 | 3;
type Order = {
  id: string;
  destination: string;
  items: number;
  colour: string;
  stage: StageIndex;
};

type Activity = {
  id: number;
  message: string;
  time: string;
};

const initialOrders: Order[] = [
  {
    id: 'OB-10429',
    destination: 'Manchester',
    items: 3,
    colour: '#e7ae45',
    stage: 0,
  },
  {
    id: 'OB-10431',
    destination: 'Bristol',
    items: 1,
    colour: '#8e78d7',
    stage: 1,
  },
  {
    id: 'OB-10434',
    destination: 'Leeds',
    items: 5,
    colour: '#4eb6c2',
    stage: 2,
  },
  {
    id: 'OB-10436',
    destination: 'Birmingham',
    items: 2,
    colour: '#e98262',
    stage: 3,
  },
];

const initialActivity: Activity[] = [
  { id: 1, time: 'now', message: 'Order OB-10434 reached Packing' },
  { id: 2, time: '−5s', message: 'RCV-SCN-01 checked in' },
  { id: 3, time: '−12s', message: 'Label printed first time. Lovely.' },
];

function nextStage(stage: StageIndex): StageIndex {
  return ((stage + 1) % stages.length) as StageIndex;
}

function movementMessage(order: Order, stage: StageIndex) {
  if (order.stage === 3) {
    return `${order.id} left Dispatch. Safe travels.`;
  }

  return `${order.id} reached ${stages[stage].name}`;
}

export function App() {
  const [orders, setOrders] = useState(initialOrders);
  const [selectedOrderId, setSelectedOrderId] = useState('OB-10431');
  const [activity, setActivity] = useState(initialActivity);
  const [dispatches, setDispatches] = useState(38);

  useEffect(() => {
    let movement = 0;
    const timer = window.setInterval(() => {
      setOrders((currentOrders) => {
        const orderIndex = movement % currentOrders.length;
        movement += 1;
        const movingOrder = currentOrders[orderIndex];

        if (!movingOrder) return currentOrders;

        const stage = nextStage(movingOrder.stage);
        const nextOrders = currentOrders.map((order, index) =>
          index === orderIndex ? { ...order, stage } : order,
        );

        setActivity((currentActivity) =>
          [
            {
              id: Date.now(),
              time: 'now',
              message: movementMessage(movingOrder, stage),
            },
            ...currentActivity.map((event, index) => ({
              ...event,
              time: index === 0 ? '−4s' : event.time,
            })),
          ].slice(0, 3),
        );

        if (movingOrder.stage === 3) {
          setDispatches((count) => count + 1);
        }

        return nextOrders;
      });
    }, 3600);

    return () => window.clearInterval(timer);
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? orders[0],
    [orders, selectedOrderId],
  );

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
          <i /> Live demo
        </div>
        <button className="trouble-button" type="button">
          Cause some trouble
        </button>
      </header>

      <section className="summary" aria-label="Operational summary">
        <div>
          <strong>{dispatches}</strong>
          <span>orders/hour</span>
        </div>
        <div>
          <strong>8/8</strong>
          <span>devices online</span>
        </div>
        <div>
          <strong>{orders.length}</strong>
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
            <span className="floor-status-dot" /> Simulation running
          </p>
        </div>

        <div className="route" aria-label="Warehouse workflow">
          <div className="conveyor" aria-hidden="true" />
          {orders.map((order) => (
            <button
              aria-label={`Follow ${order.id}, currently at ${stages[order.stage].name}`}
              aria-pressed={selectedOrderId === order.id}
              className={`parcel parcel-${order.stage} ${selectedOrderId === order.id ? 'selected' : ''}`}
              key={order.id}
              onClick={() => setSelectedOrderId(order.id)}
              style={{ '--parcel-colour': order.colour } as CSSProperties}
              type="button"
            >
              <span>{order.id}</span>
            </button>
          ))}
          {stages.map((stage, index) => (
            <article className="station" key={stage.name}>
              <div className="station-index">0{index + 1}</div>
              <span className="device-light" aria-label="Device healthy" />
              <h2>{stage.name}</h2>
              <p>{stage.note}</p>
              <code>{stage.device}</code>
            </article>
          ))}
        </div>

        {selectedOrder ? (
          <aside className="order-focus" aria-live="polite">
            <div>
              <span className="focus-label">Following</span>
              <strong>{selectedOrder.id}</strong>
            </div>
            <div>
              <span>Now at</span>
              <strong>{stages[selectedOrder.stage].name}</strong>
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
        {activity.map((event) => (
          <p key={event.id}>
            <time>{event.time}</time> {event.message}
          </p>
        ))}
      </footer>
    </main>
  );
}
