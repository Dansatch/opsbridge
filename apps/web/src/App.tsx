const stages = [
  {
    name: 'Receiving',
    note: 'Ready for the next arrival',
    device: 'RCV-SCN-01',
  },
  { name: 'Picking', note: 'Three orders on the move', device: 'PK-HHD-02' },
  { name: 'Packing', note: 'Labels behaving themselves', device: 'PKG-PRN-01' },
  { name: 'Dispatch', note: 'Bay 2 is loading', device: 'DSP-SCN-01' },
];

export function App() {
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
          <strong>42</strong>
          <span>orders/hour</span>
        </div>
        <div>
          <strong>8/8</strong>
          <span>devices online</span>
        </div>
        <div>
          <strong>4</strong>
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
          <p>Live simulation warming up</p>
        </div>

        <div className="route" aria-label="Warehouse workflow">
          <div className="conveyor" aria-hidden="true" />
          <div className="parcel parcel-one">
            <span>OB-10429</span>
          </div>
          <div className="parcel parcel-two">
            <span>OB-10431</span>
          </div>
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
      </section>

      <footer className="activity">
        <div>
          <span className="pulse" /> Recent activity
        </div>
        <p>
          <time>10:24:03</time> Order OB-10428 reached Packing
        </p>
        <p>
          <time>10:23:58</time> RCV-SCN-01 checked in
        </p>
        <p>
          <time>10:23:51</time> Label printed first time. Lovely.
        </p>
      </footer>
    </main>
  );
}
