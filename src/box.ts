import * as types from "@scoopika/types";
import Client from "./client";
import { executeStreamHooks } from "./lib/read_stream";
import executeAction from "./lib/actions_executer";

class Box {
  id: string;
  client: Client;
  client_actions: types.ToolSchema[] = [];

  constructor(id: string, client: Client) {
    this.id = id;
    this.client = client;
  }

  async load() {
    let response: string = "";
    const onMessage = (s: string) => {
      response += s;
    };

    const req: types.LoadBoxRequest = {
      type: "load_box",
      payload: {
        id: this.id,
      },
    };

    await this.client.request(req, onMessage);
    const box = this.client.readResponse<types.BoxData>(response);

    return box;
  }

  async run({
    inputs,
    options,
    hooks,
  }: {
    inputs: types.RunInputs;
    options?: types.RunOptions;
    hooks?: types.BoxHooks;
  }): Promise<
    {
      name: string;
      run: types.AgentResponse;
    }[]
  > {
    if (!hooks) {
      hooks = {};
    }

    let response:
      | {
          name: string;
          run: types.AgentResponse;
        }[]
      | undefined = undefined;

    hooks.onClientSideAction = (action) =>
      executeAction(action, [
        ...(options?.tools || []),
        ...this.client_actions,
      ]);
    hooks.onBoxFinish = (action) => {
      response = action;
    };

    const used_hooks = Object.keys(hooks) as (keyof types.Hooks)[];

    const req: types.RunBoxRequest = {
      type: "run_box",
      payload: {
        id: this.id,
        inputs,
        options: {
          ...(options || {}),
          tools: [...(options?.tools || []), ...this.client_actions],
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

export default Box;
