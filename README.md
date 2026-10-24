# OpsBridge

OpsBridge is a live warehouse operations simulator built to demonstrate how I
approach real-time operational systems. Orders move through receiving, picking,
packing and dispatch while simulated scanners, cameras, handhelds and printers
report their state.

The first public release will let visitors follow orders, inspect equipment,
trigger realistic failures and recover the operation without an account or any
setup.

## Current build

The current build runs a lightweight order simulation in the browser. Parcels move
through all four workflow stages, update the activity feed and can be selected to
follow their contents and destination. Each commit on `main` remains buildable and
shippable while device events and recovery workflows are added in reviewable steps.

The shared `@opsbridge/domain` package owns the workflow, orders, device states,
operational event contracts, incident model and deterministic simulation clock.
The control-room UI renders that state rather than maintaining a separate version
of the warehouse rules.

Fastify now owns the running simulation and publishes snapshots through
`/api/live`. The React client subscribes over WebSockets, reconnects automatically
and uses `/api/simulation` as an HTTP snapshot fallback.

Operational events are written to SQLite as they happen and are available from
`/api/events`. The store keeps transport and persistence concerns outside the
simulation rules, and caps history requests at 100 records.

Every order transition now activates a second piece of simulated equipment:
cameras capture arrivals and quality checks, scanners verify picks, and handhelds
assign dispatch bays. Selecting any of the eight devices opens a compact health
and recent-activity view without leaving the warehouse floor.

The failure drill can disconnect or slow a scanner, jam the packing printer or
fail a label check. The affected device and station react immediately, blocked
orders stay put, and the event is shared with every connected control-room view.

OpsBridge now detects each injected fault automatically, assigns warning or
critical priority and opens a focused incident in the control room. Visitors can
acknowledge it without losing sight of the affected equipment or warehouse flow.

```sh
pnpm install
pnpm verify
pnpm start
```

Open `http://localhost:3000`. During development, run `pnpm dev` and open
`http://localhost:5173`.

## Deployment

`render.yaml` defines one free Render web service. Fastify serves the compiled
React application and API from the same process, leaving one public origin for
HTTP and WebSocket traffic. Every verified push to `main` can deploy automatically.

The free service may sleep when unused and its local filesystem is not permanent.
OpsBridge therefore treats SQLite as rebuildable demo state rather than durable
customer data.

## Technology

- React, TypeScript and Vite
- Node.js and Fastify
- WebSockets
- SQLite
- Vitest

See [the product brief](docs/product.md) for the launch scope and design rules.
