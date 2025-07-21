(function () {
  const log = document.getElementById('log');
  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // store state
  const players = new Map();
  let myId = null;

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const socket = new WebSocket(`${protocol}://${location.hostname}:8080`);

  socket.addEventListener('open', () => {
    addLine('[system] Connected to server');
  });

  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'system') {
      addLine(`[system] ${msg.text}`);
    } else if (msg.type === 'chat') {
      addLine(`[${msg.from}] ${msg.text}`);
    } else if (msg.type === 'welcome') {
      addLine(`[system] Assigned id ${msg.id}`);
      myId = msg.id;
    } else if (msg.type === 'state') {
      // update players snapshot
      players.clear();
      for (const p of msg.players) {
        players.set(p.id, p);
      }
    }
  });

  socket.addEventListener('close', () => {
    addLine('[system] Disconnected');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (input.value.trim() !== '') {
      socket.send(JSON.stringify({ text: input.value.trim() }));
      input.value = '';
    }
  });

  window.addEventListener('keydown', (e) => handleKey(e, true));
  window.addEventListener('keyup', (e) => handleKey(e, false));

  function handleKey(e, pressed) {
    const keyMap = {
      ArrowUp: 'up',
      ArrowDown: 'down',
      ArrowLeft: 'left',
      ArrowRight: 'right',
    };
    const dir = keyMap[e.key];
    if (dir) {
      socket.send(JSON.stringify({ type: 'move', dir, pressed }));
      e.preventDefault();
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of players.values()) {
      ctx.fillStyle = p.id === myId ? '#0f0' : '#fff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(render);
  }
  render();

  function addLine(text) {
    const div = document.createElement('div');
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
})();