import { WebSocket } from 'ws';

export class Player {
  constructor(public id: string, public socket: WebSocket) {}
}