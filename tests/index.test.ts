import { test, expect } from "vitest";
import { Client, Agent, Box } from "../src";
import crypto from "node:crypto";
import { StoreSession } from "@scoopika/types";

const agent_id = process.env.AGENT_ID;
const box_id = process.env.BOX_ID;

if (!agent_id) {
  throw new Error("Make sure AGENT_ID and BOX_ID exist in .env file");
}

const client = new Client("http://localhost:4149/scoopika");
const agent = new Agent(agent_id, client);
const box = new Box(box_id || "", client);

const user_id = crypto.randomUUID();
let session: StoreSession = {} as StoreSession;

test("Create session", async () => {
  session = await client.store.newSession({ user_id });

  expect(session.user_id).toBe(user_id);
  expect(typeof session.id).toBe("string");
});

test("Load agent", async () => {
  const agent_data = await agent.load();

  expect(agent_data.id).toBe(agent_id);
  expect(typeof agent_data.name).toBe("string");
});

test("Run agent", async () => {
  let message: string = "";
  const response = await agent.run({
    options: {
      session_id: session.id,
      run_id: `run_${Date.now()}`
    },
    inputs: {
      message: "Hello!",
    },
    hooks: {
      onStart: (s) => console.log(s),
      onToken: (t) => (message += t),
      onStream: (_s) => {},
    },
  });

  console.log(message);
  expect(response.session_id).toBe(session.id);
  expect(typeof response.content).toBe("string");
});

test("List user sessions", async () => {
  const sessions = await client.store.listUserSessions(user_id);

  expect(typeof sessions).toBe("object");
  expect(sessions.length).toBe(1);
  expect(sessions[0]).toBe(session.id);
});

test("Get session", async () => {
  const ret_session = await client.store.getSession(session.id);

  expect(ret_session.id).toBe(session.id);
  expect(ret_session.user_id).toBe(user_id);
});

test("Get session runs", async () => {
  const runs = await client.store.getSessionRuns(session.id);

  expect(typeof runs).toBe("object");
  expect(runs.length).toBe(2);
});

test("Run box", async () => {
  if (!box_id) {
    console.warn("[-] Skipped running box as BOX_ID not found in .env");
    return;
  }

  const response = await box.run({
    inputs: {
      message: "Hello!",
    },
    hooks: {
      onStart: (s) => console.log(s),
    },
  });

  expect(typeof response[0].run.content).toBe("string");
});

test("Load box", async () => {
  if (!box_id) {
    console.warn("[-] Skipped loading box as BOX_ID not found in .env");
    return;
  }

  const box_data = await box.load();

  expect(box_data.id).toBe(box_id);
  expect(typeof box_data.manager).toBe("string");
});

test("Delete session", async () => {
  const status = await client.store.deleteSession(session.id);
  expect(status).toBe(true);
});
