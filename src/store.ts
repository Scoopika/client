import {
  GetSessionRequest,
  GetSessionRunsRequest,
  ListUserSessionsRequest,
  NewSessionRequest,
  RunHistory,
  StoreSession,
} from "@scoopika/types";
import Client from "./client";

class Store {
  client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async getSession(id: string, allow_new?: boolean) {
    let response: string = "";
    const onMessage = (s: string) => {
      response += s;
    };

    const req: GetSessionRequest = {
      type: "get_session",
      payload: { id, allow_new },
    };

    await this.client.request(req, onMessage);
    const session = this.client.readResponse<StoreSession>(response);

    return session;
  }

  async newSession(data?: {
    id?: string;
    user_id?: string;
    user_name?: string;
  }) {
    let response: string = "";
    const onMessage = (s: string) => (response += s);

    const req: NewSessionRequest = {
      type: "new_session",
      payload: data || {},
    };

    await this.client.request(req, onMessage);
    const session = this.client.readResponse<StoreSession>(response);

    return session;
  }

  async listUserSessions(user_id: string) {
    let response: string = "";
    const onMessage = (s: string) => (response += s);

    const req: ListUserSessionsRequest = {
      type: "list_user_sessions",
      payload: {
        id: user_id,
      },
    };

    await this.client.request(req, onMessage);
    const sessions = this.client.readResponse<{
      sessions: string[];
    }>(response);

    return sessions.sessions;
  }

  async getSessionRuns(session_id: string) {
    let response: string = "";
    const onMessage = (s: string) => (response += s);

    const req: GetSessionRunsRequest = {
      type: "get_session_runs",
      payload: {
        id: session_id,
      },
    };

    await this.client.request(req, onMessage);
    const runs = this.client.readResponse<{
      runs: RunHistory[];
    }>(response);

    return runs.runs;
  }
}

export default Store;