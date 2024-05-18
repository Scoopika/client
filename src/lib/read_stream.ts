import { BoxHooks, Hooks, ServerStream } from "@scoopika/types";
import { ReadableStreamReadResult } from "stream/web";
import streamMessages from "./stream_messages";

export async function executeStreamHooks(value: string, hooks: BoxHooks) {
  const stream = JSON.parse(value) as ServerStream;
  const type = stream.type;
  const data = stream.data;

  const mappings: Record<
    ServerStream["type"],
    ((data: ServerStream["data"]) => any) | undefined
  > = {
    start: hooks.onStart,
    stream: hooks.onStream,
    response: hooks.onFinish,
    token: hooks.onToken,
    tool_call: hooks.onToolCall,
    tool_result: hooks.onToolResult,
    agent_response: hooks.onAgentResponse,
    error: hooks.onError,
    select_agent: hooks.onSelectAgent,
    box_response: hooks.onBoxFinish,
    client_action: hooks.onClientSideAction,
    end: undefined,
  };

  const func = mappings[type];

  if (func && typeof func === "function") {
    await func(data);
  }
}

export default async function readStreamChunk(
  chunk: ReadableStreamReadResult<Uint8Array>,
  callback: (s: string) => any,
  pre?: string,
) {
  if (!chunk.value) {
    return;
  }

  const decoder = new TextDecoder();
  let value = decoder.decode(chunk.value);

  if (value.startsWith("<SCOOPSTREAM>") && pre) {
    console.warn("There was a lost stream chunk that did not end");
    pre = undefined;
  }

  value = (pre || "") + value;
  const stream_messages = streamMessages(value);

  if (value.startsWith("<SCOOPSTREAM>") && stream_messages.length < 1) {
    return value;
  }

  for await (const message of stream_messages) {
    await callback(message);
  }
}
