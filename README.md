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
