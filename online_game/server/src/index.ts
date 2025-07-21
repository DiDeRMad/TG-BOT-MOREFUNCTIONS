import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GameRoom } from './game/GameRoom';

const PORT = parseInt(process.env.PORT || '8080', 10);

// Create a basic HTTP server (required by some host providers)
const server = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Super Online Game server is running');
});

const wss = new WebSocketServer({ server });
const room = new GameRoom();

wss.on('connection', (socket: WebSocket) => {
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