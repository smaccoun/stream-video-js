import { keepAlive } from './keepAlive';
import { UserRequest } from '../gen/video_models/models';
import { AuthPayload, WebsocketEvent } from '../gen/video_events/events';

import type { StreamWSClient } from './types';

export class StreamWebSocketClient implements StreamWSClient {
  private readonly ws: WebSocket;
  private readonly token: string;
  private readonly user: UserRequest;

  private readonly schedulePing: () => void;

  private subscribers: { [event: string]: EventListener[] } = {};
  private hasReceivedMessage = false;

  constructor(endpoint: string, token: string, user: UserRequest) {
    const ws = new WebSocket(endpoint);
    ws.binaryType = 'arraybuffer';
    ws.onerror = this.onConnectionError;
    ws.onclose = this.onConnectionClose;
    ws.onopen = this.onConnectionOpen;
    ws.onmessage = this.onMessage;

    this.token = token;
    this.user = user;
    this.ws = ws;
    // @ts-ignore
    this.schedulePing = keepAlive(this, 35 * 1000); // seconds
  }

  private onConnectionError = (e: Event) => {
    console.error(`An error has occurred`, e);
  };

  private onConnectionClose = (e: CloseEvent) => {
    console.warn(`Connection closed`, e);
  };

  private onConnectionOpen = (e: Event) => {
    console.log(`Connection established`, this.ws.url, e);

    this.authenticate();
  };

  private onMessage = (e: MessageEvent) => {
    console.debug(`Message received`, e.data);
    this.schedulePing();

    if (!(e.data instanceof ArrayBuffer)) {
      console.error(`This socket only accepts exchanging binary data`);
      return;
    }

    const data = new Uint8Array(e.data);
    const message = WebsocketEvent.fromBinary(data);
    console.log('Message', message);

    // submit the message for processing
    this.dispatchMessage(message);
  };

  private authenticate = () => {
    console.log('Authenticating...');
    this.sendMessage(
      AuthPayload.toBinary({
        token: this.token,
        user: this.user,
      }),
    );
  };

  // TODO fix types
  private dispatchMessage = (message: object) => {
    console.log('Dispatching', message);

    // FIXME OL: POC: temporary flag, used for auth checks
    this.hasReceivedMessage = true;
  };

  disconnect = () => {
    // FIXME: OL: do proper cleanup of resources here.
    console.log(`Disconnect requested`);
    this.ws.close(1000, `Disconnect requested`);
  };

  ensureAuthenticated = async () => {
    // FIXME OL: POC: find more elegant way to accomplish this.
    return new Promise<void>((resolve, reject) => {
      const giveUpAfterMs = 3000;
      const frequency = 100;
      let attempts = giveUpAfterMs / frequency;
      let q = setInterval(() => {
        console.log('Checking...');
        if (this.hasReceivedMessage) {
          clearInterval(q);
          resolve();
        } else if (attempts < 1) {
          clearInterval(q);
          reject('Unsuccessful authentication');
        }
        attempts--;
      }, frequency);
    });
  };

  sendMessage = (data: Uint8Array) => {
    this.ws.send(data);
    this.schedulePing();
  };

  // @ts-ignore
  on = (event: string, fn: EventListener) => {
    const listeners = this.subscribers[event] || [];
    listeners.push(fn);
    this.subscribers[event] = listeners;
    return () => {
      this.off(event, fn);
    };
  };

  // @ts-ignore
  off = (event: string, fn: EventListener) => {
    this.subscribers[event] = (this.subscribers[event] || []).filter(
      (f) => f !== fn,
    );
  };
}
