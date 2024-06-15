import { AudioStream } from "@scoopika/types";
import sleep from "./lib/sleep";

class RunVoicePlayer {
  private elm: HTMLAudioElement;
  private listeners: Record<number, () => any> = {};
  private done_indexes: number[] = [];
  paused: boolean = false;
  started: boolean = false;

  constructor(elm: HTMLAudioElement | string) {
    const element = (
      typeof elm === "string" ? document.getElementById(elm) : elm
    ) as HTMLAudioElement;

    if (!element) {
      throw new Error("Audio element is not found");
    }

    this.elm = element;
    this.elm.crossOrigin = "anonymous";
  }

  async queue(stream: AudioStream) {
    this.started = true;
    const url = stream.read;

    if (stream.index === 0) {
      this.play(stream.index, url);
      return;
    }

    if (this.done_indexes.indexOf(stream.index - 1) !== -1) {
      this.play(stream.index, url);
      return;
    }

    const play = this.play.bind(this);
    this.listeners[stream.index - 1] = () => {
      play(stream.index, url);
    };
  }

  private play(index: number, url: string) {
    this.elm.src = url;

    this.elm.onended = () => {
      const listener = this.listeners[index];
      if (listener) listener();

      this.done_indexes.push(index);
    };

    if (!this.paused) {
      this.elm.play();
    }
  }

  public pause() {
    this.elm.pause();
    this.paused = true;
  }

  public resume() {
    if (!this.paused) return;
    this.elm.play();
    this.paused = false;
  }

  public isDone(length: number) {
    return this.done_indexes.length === length;
  }

  public async finish(length: number) {
    while (this.done_indexes.length !== length) {
      await sleep(5);
    }

    this.done_indexes = [];
    this.listeners = {};
    this.elm.src = "";
    this.started = false;
    return true;
  }
}

export default RunVoicePlayer;
