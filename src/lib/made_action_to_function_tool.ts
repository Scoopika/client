import { FunctionToolSchema, ToolFunction } from "@scoopika/types";

export default function madeActionToFunctionTool({
  execute,
  schema,
}: {
  execute: (inputs: any) => any;
  schema: ToolFunction;
}): FunctionToolSchema {
  return {
    type: "function",
    executor: execute,
    tool: {
      type: "function",
      function: schema,
    },
  };
}
