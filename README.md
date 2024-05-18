# Scoopika Client

[Documentation](https://docs.scoopika.com/packages/ts/client) | [Github repo](https://github.com/scoopika/client)

This package facilitates communication with a Scoopika server, allowing you to run LLM-powered agents and multi-agent boxes from the client-side with client-side actions and real-time streaming hooks supported out-of-the-box.

## Installation

### Using Npm

```bash
npm install @scoopika/client
```

### Using Bun

```bash
bun add @scoopika/client
```

Note: This package has been tested with Bun version 1.0.15.

### Using a CDN

```html
<script src="https://cdn.jsdelivr.net/npm/@scoopika/client/index.global.js"></script>
```

When loaded from a CDN, the global variable is `Scoopika`.

## Usage

Ensure you have a running Scoopika server. Refer to the [documentation](https://docs.scoopika.com) for more details.

### Initialize client:

```typescript
import { Client } from "@scoopika/client";

const client = new Client("SCOOPIKA_SERVER_URL");

// iife
const client = new Scoopika.Client("SCOOPIKA_SERVER_URL");
```

### Run AI agent

```typescript
import { Client, Agent } from "@scoopika/client";

const client = new Client("SCOOPIKA_SERVER_URL");
const agent = new Agent("AGENT_ID", client);

(async () => {
  const response = await agent.run({
    inputs: { message: "Hello!" },
    hooks: {
      onToken: (token) => console.log(token), // real-time hook
    },
  });

  console.log(response);
})();
```

### Run Multi-agent box

```typescript
import { Client, Box } from "@scoopika/client";

const client = new Client("SCOOPIKA_SERVER_URL");
const box = new Box("BOX_ID", client);

(async () => {
  const response = await box.run({
    inputs: { message: "Hello!" },
    hooks: {
      onToken: (token) => console.log(token), // real-time hook
    },
  });

  console.log(response);
})();
```

### Manage history sessions

```typescript
import { Client, Agent } from "@scoopika/client";

const client = new Client("SCOOPIKA_SERVER_URL");

(async () => {
  // Create new session
  const session = await client.store.newSesssion({
    user_id: "USER_1", // optional
  });
  console.log(session); // StoreSession

  // Get session info by id
  const mySession = await client.store.getSession(session.id);
  console.log(mySession); // StoreSession

  // List user sessions
  const userSessions = await client.store.listUserSessions("USER_1");
  console.log(userSessions); // string[]

  // Get session runs (messages)
  const runs = await client.store.getSessionRuns(userSessions[0]);
  console.log(runs); // HistoryRun[]
})();
```

## Development

You're free to clone the [Github repository](https://github.com/scoopika/client), The code can be found in the `src` directory and the tests in the `tests` and `e2e` directories.

Read the `tests/README.md` for more information on how to setup and run tests.
