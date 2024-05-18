import express from "express";
import cors from "cors";
import {
  Scoopika,
  Container,
  setupAgents,
  setupBoxes,
} from "@scoopika/scoopika";

const scoopika_token = process.env.SCOOPIKA_TOKEN;
const agent_id = process.env.AGENT_ID;
const box_id = process.env.BOX_ID;

if (!scoopika_token || !agent_id) {
  throw new Error(
    "Make sure you have all the required variables in the .env file",
  );
}

const scoopika = new Scoopika({
  token: scoopika_token,
  engines: {
    fireworks: process.env.FIREWORKS_TOKEN,
  },
});

const container = new Container({
  scoopika,
  setupAgents: setupAgents([agent_id]),
  setupBoxes: setupBoxes(box_id ? [box_id] : []),
});

const app = express();
app.use(express.json());
app.use(cors());

app.post("/scoopika", async (req, res) => {
  await container.handleRequest({
    request: req.body,
    stream: (s) => res.write(s),
    end: () => res.end(),
  });
});

app.listen(4149, () => {
  console.log("listening on port 4149");
});
