"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const GameRoom_1 = require("./game/GameRoom");
const PORT = parseInt(process.env.PORT || '8080', 10);
// Create a basic HTTP server (required by some host providers)
const server = http_1.default.createServer((_, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Super Online Game server is running');
});
const wss = new ws_1.WebSocketServer({ server });
const room = new GameRoom_1.GameRoom();
wss.on('connection', (socket) => {
    const player = room.addPlayer(socket);
    socket.on('message', (data) => {
        room.handlePlayerMessage(player, data.toString());
    });
    socket.on('close', () => {
        room.removePlayer(player);
    });
});
server.listen(PORT, () => {
    /* eslint-disable no-console */
    console.log(`Server listening on port ${PORT}`);
});
