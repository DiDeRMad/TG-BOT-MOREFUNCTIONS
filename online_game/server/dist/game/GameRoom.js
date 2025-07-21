"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const uuid_1 = require("uuid");
const Player_1 = require("./Player");
class GameRoom {
    constructor() {
        this.players = new Map();
        /** Game loop at ~20 Hz */
        this.interval = setInterval(() => {
            this.tick();
        }, 50);
    }
    addPlayer(socket) {
        const id = (0, uuid_1.v4)();
        const player = new Player_1.Player(id, socket);
        this.players.set(id, player);
        socket.send(JSON.stringify({ type: 'welcome', id }));
        this.broadcastSystem(`${id} joined the room`);
        return player;
    }
    removePlayer(player) {
        this.players.delete(player.id);
        this.broadcastSystem(`${player.id} left the room`);
    }
    handlePlayerMessage(player, raw) {
        let msg;
        try {
            msg = JSON.parse(raw);
        }
        catch {
            // If not JSON, treat it as plain text
            msg = { text: raw };
        }
        // Chat
        if (typeof msg.text === 'string') {
            this.broadcast({ type: 'chat', from: player.id, text: msg.text });
        }
        // Movement command { type: 'move', dir: 'up'|'down'|'left'|'right', pressed: true|false }
        if (msg.type === 'move' && typeof msg.dir === 'string' && typeof msg.pressed === 'boolean') {
            switch (msg.dir) {
                case 'up':
                    player.moveUp = msg.pressed;
                    break;
                case 'down':
                    player.moveDown = msg.pressed;
                    break;
                case 'left':
                    player.moveLeft = msg.pressed;
                    break;
                case 'right':
                    player.moveRight = msg.pressed;
                    break;
            }
        }
    }
    tick() {
        // Update players positions
        for (const p of this.players.values()) {
            p.updatePosition();
        }
        // Broadcast state to all players
        const snapshot = Array.from(this.players.values()).map((p) => ({
            id: p.id,
            x: Math.round(p.x),
            y: Math.round(p.y),
        }));
        this.broadcast({ type: 'state', players: snapshot });
    }
    broadcast(obj) {
        const data = JSON.stringify(obj);
        for (const p of this.players.values()) {
            p.socket.send(data);
        }
    }
    broadcastSystem(text) {
        this.broadcast({ type: 'system', text });
    }
}
exports.GameRoom = GameRoom;
