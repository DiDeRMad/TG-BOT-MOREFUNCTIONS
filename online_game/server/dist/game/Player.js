"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(id, socket) {
        this.id = id;
        this.socket = socket;
        this.x = Math.random() * 500;
        this.y = Math.random() * 500;
        // movement flags set by client input
        this.moveUp = false;
        this.moveDown = false;
        this.moveLeft = false;
        this.moveRight = false;
    }
    updatePosition() {
        let dx = 0;
        let dy = 0;
        if (this.moveUp)
            dy -= Player.SPEED;
        if (this.moveDown)
            dy += Player.SPEED;
        if (this.moveLeft)
            dx -= Player.SPEED;
        if (this.moveRight)
            dx += Player.SPEED;
        this.x += dx;
        this.y += dy;
        // simple bounds
        this.x = Math.max(0, Math.min(500, this.x));
        this.y = Math.max(0, Math.min(500, this.y));
    }
}
exports.Player = Player;
// speed in units per tick
Player.SPEED = 4;
