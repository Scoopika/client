import { ServerRequest } from "@scoopika/types";
import readStreamChunk from "./lib/read_stream";
import Store from "./store";

class Client {
  apiUrl: string;
  store: Store;

  constructor(apiUrl: string) {
    if (apiUrl.endsWith("/")) {
      apiUrl = apiUrl.substring(0, apiUrl.length - 1);
    }
    this.apiUrl = apiUrl;
    this.store = new Store(this);
  }

  async request(req: ServerRequest, onMessage: (msg: string) => any) {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req),
    };

    const res = await fetch(this.apiUrl, options);
    const reader = res.body?.getReader();
    let chunked: string | undefined;

    if (!reader) {
      throw new Error("Can't get HTTP stream reader");
    }

    while (true) {
      const chunk = await reader.read();
      const read = await readStreamChunk(chunk, onMessage, chunked);

      if (typeof read === "string") {
        chunked = read;
      } else {
        chunked = undefined;
      }

      if (chunk.done) {
        break;
      }
    }

    reader?.releaseLock();
  }

  readResponse<Response>(s: string): Response {
    try {
      return JSON.parse(s) as Response;
    } catch (err: any) {
      throw new Error(`Can't read server response: ${err}`);
    }
  }
}

export default Client;
