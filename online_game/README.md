# Super Online Game (Prototype)

This repository contains the initial scaffold of a real-time online game designed to scale well beyond 200 000 lines of code as development progresses.

Directory layout:

* `server/` – Node.js + TypeScript WebSocket server
* `client/` – Browser client that connects via WebSocket

## Quick start

1. Install dependencies and run the server:

```bash
cd server
npm install
npm run dev
```

2. Open the client in your browser:

```bash
cd ../client
# If you have a static-file server (e.g. live-server or http-server):
# npm install -g live-server
live-server .
```

Open http://localhost:8080 (if using live-server it will pick a free port) – the page automatically connects to the WS server on port 8080.

## Next steps

The current prototype only supports:

* Connecting/disconnecting players
* Simple chat broadcast

Planned modules:

* Match-making & room management
* Game-world synchronisation (authoritative server)
* Persistent user accounts and progress
* Physics & state interpolation
* Front-end rendering (Three.js / Babylon.js)
* CI/CD pipeline with tests and linting

Feel free to dive in and evolve the codebase – 200 000+ lines are just a matter of time 🙂