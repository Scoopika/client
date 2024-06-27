import * as types from "@scoopika/types";
import Client from "./client";
import { executeStreamHooks } from "./lib/read_stream";
import executeAction from "./lib/actions_executer";
import { z } from "zod";
import { createAction } from "./actions/create_action";
import madeActionToFunctionTool from "./lib/made_action_to_function_tool";
import zodToJsonSchema from "zod-to-json-schema";

class Agent {
  id: string;
  client: Client;
  client_actions: types.ToolSchema[] = [];
  paused_runs: string[] = [];

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

  public async structuredOutput<
    SCHEMA extends z.ZodTypeAny = any,
    DATA = z.infer<SCHEMA>,
  >({
    inputs,
    options,
    schema,
    system_prompt,
  }: {
    inputs: types.RunInputs;
    options?: types.RunOptions;
    schema: SCHEMA;
    system_prompt?: string;
  }): Promise<DATA> {
    let response: string = "";
    const onMessage = (s: string) => (response += s);

    const json = zodToJsonSchema(schema);
    const req: types.GenerateJSONRequest = {
      type: "generate_json",
      payload: {
        id: this.id,
        inputs,
        options,
        system_prompt,
        schema: json as any,
      },
    };

    await this.client.request(req, onMessage);
    const data = this.client.readResponse<DATA>(response);

    return data;
  }

  async run({
    inputs,
    hooks,
    options,
  }: {
    inputs: types.RunInputs;
    options?: types.RunOptions;
    hooks?: types.Hooks;
  }): Promise<types.AgentResponse> {
    if (!hooks) {
      hooks = {};
    }

    options = options ?? {};
    options.run_id = options.run_id ?? "run_" + crypto.randomUUID();

    let response: types.AgentResponse | undefined = undefined;
    hooks.onClientSideAction = (action) =>
      executeAction(action, [
        ...(options?.tools || []),
        ...this.client_actions,
      ]);
    hooks.onAgentResponse = (action) => {
      response = action.response;
    };
    const used_hooks = Object.keys(hooks) as (keyof types.Hooks)[];

    const req: types.RunAgentRequest = {
      type: "run_agent",
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
      if (this.paused_runs.indexOf(options.run_id || "NONE") !== -1) return;
      await executeStreamHooks(s, hooks);
    };

    await this.client.request(req, onMessage);

    if (!response) {
      throw new Error("Did not receive a final response from the server");
    }

    return response;
  }

  addClientAction<PARAMETERS extends z.ZodTypeAny, RESULT = any>(
    tool?: types.CoreTool<PARAMETERS, RESULT>,
  ) {
    if (!tool) return;

    const action = createAction(tool);
    this.client_actions = [
      ...this.client_actions.filter(
        (a) => a.tool.function.name !== action.schema.name,
      ),
      madeActionToFunctionTool(action),
    ];
  }

  removeClientAction(name: string) {
    this.client_actions = this.client_actions.filter(
      (c) => c.tool.function.name !== name,
    );
  }

  cancelRun(run_id: string) {
    this.paused_runs.push(run_id);
  }
}

export default Agent;
