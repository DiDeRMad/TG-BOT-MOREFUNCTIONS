import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Player } from './Player';

export class GameRoom {
  private players: Map<string, Player> = new Map();

  addPlayer(socket: WebSocket): Player {
    const id = uuidv4();
    const player = new Player(id, socket);
    this.players.set(id, player);

    socket.send(JSON.stringify({ type: 'welcome', id }));
    this.broadcastSystem(`${id} joined the room`);

    return player;
  }

  removePlayer(player: Player) {
    this.players.delete(player.id);
    this.broadcastSystem(`${player.id} left the room`);
  }

  handlePlayerMessage(player: Player, raw: string) {
    let msg: any;
    try {
      msg = JSON.parse(raw);
    } catch {
      // If not JSON, treat it as plain text
      msg = { text: raw };
    }

    // For now just broadcast chat message
    if (typeof msg.text === 'string') {
      this.broadcast({ type: 'chat', from: player.id, text: msg.text });
    }
  }

  private broadcast(obj: any) {
    const data = JSON.stringify(obj);
    for (const p of this.players.values()) {
      p.socket.send(data);
    }
  }

  private broadcastSystem(text: string) {
    this.broadcast({ type: 'system', text });
  }
}