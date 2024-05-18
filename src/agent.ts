import * as types from "@scoopika/types";
import Client from "./client";
import { executeStreamHooks } from "./lib/read_stream";
import executeAction from "./lib/actions_executer";

class Agent {
  id: string;
  client: Client;
  client_actions: types.ToolSchema[] = [];

  constructor(id: string, client: Client) {
    this.id = id;
    this.client = client;
  }

  async load() {
    let response: string = "";
    const onMessage = (s: string) => (response += s);

    const req: types.LoadAgentRequest = {
      type: "load_agent",
      payload: {
        id: this.id,
      },
    };

    await this.client.request(req, onMessage);
    const agent = this.client.readResponse<types.AgentData>(response);

    return agent;
  }

  async run({
    inputs,
    hooks,
  }: {
    inputs: types.Inputs;
    hooks?: types.Hooks;
  }): Promise<types.AgentResponse> {
    if (!hooks) {
      hooks = {};
    }

    let response: types.AgentResponse | undefined = undefined;
    hooks.onClientSideAction = (action) =>
      executeAction(action, [...(inputs.tools || []), ...this.client_actions]);
    hooks.onAgentResponse = (action) => {
      response = action.response;
    };
    const used_hooks = Object.keys(hooks) as (keyof types.Hooks)[];

    const req: types.RunAgentRequest = {
      type: "run_agent",
      payload: {
        id: this.id,
        inputs: {
          ...inputs,
          tools: [...(inputs.tools || []), ...this.client_actions],
        },
        hooks: used_hooks,
      },
    };

    const onMessage = async (s: string) => {
      await executeStreamHooks(s, hooks);
    };

    await this.client.request(req, onMessage);

    if (!response) {
      throw new Error("Did not receive a final response from the server");
    }

    return response;
  }

  addClientAction<Data = any>(
    func: (args: Data) => any,
    tool: types.ToolFunction,
  ) {
    this.client_actions.push({
      type: "client-side",
      executor: func,
      tool: {
        type: "function",
        function: tool,
      },
    });
  }
}

export default Agent;
