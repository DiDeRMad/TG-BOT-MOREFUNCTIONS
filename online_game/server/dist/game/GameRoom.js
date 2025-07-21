"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
const uuid_1 = require("uuid");
const Player_1 = require("./Player");
class GameRoom {
    constructor() {
        this.players = new Map();
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
        // For now just broadcast chat message
        if (typeof msg.text === 'string') {
            this.broadcast({ type: 'chat', from: player.id, text: msg.text });
        }
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
