(function () {
  const log = document.getElementById('log');
  const form = document.getElementById('form');
  const input = document.getElementById('input');

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

  function addLine(text) {
    const div = document.createElement('div');
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
})();