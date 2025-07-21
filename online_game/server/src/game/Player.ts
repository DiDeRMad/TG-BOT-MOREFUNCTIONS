import { WebSocket } from 'ws';

export class Player {
  constructor(public id: string, public socket: WebSocket) {}

  x: number = Math.random() * 500;
  y: number = Math.random() * 500;

  // movement flags set by client input
  moveUp = false;
  moveDown = false;
  moveLeft = false;
  moveRight = false;

  // speed in units per tick
  static SPEED = 4;

  updatePosition() {
    let dx = 0;
    let dy = 0;
    if (this.moveUp) dy -= Player.SPEED;
    if (this.moveDown) dy += Player.SPEED;
    if (this.moveLeft) dx -= Player.SPEED;
    if (this.moveRight) dx += Player.SPEED;

    this.x += dx;
    this.y += dy;

    // simple bounds
    this.x = Math.max(0, Math.min(500, this.x));
    this.y = Math.max(0, Math.min(500, this.y));
  }
}