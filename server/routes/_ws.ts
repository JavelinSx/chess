import { WebSocketServer } from 'ws';

const wsServer = new WebSocketServer({ noServer: true });

export default defineEventHandler(async (event) => {
  const { req, res } = event.node;

  // Проверяем, что запрос относится к WebSocket
  if (req.headers.upgrade !== 'websocket') {
    res.statusCode = 426; // Upgrade Required
    res.end('Upgrade required');
    return;
  }

  // Обновляем соединение до WebSocket
  wsServer.handleUpgrade(req, req.socket, Buffer.alloc(0), (socket) => {
    wsServer.emit('connection', socket, req);
  });

  wsServer.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('message', (message) => {
      console.log('Received:', message);
      socket.send(`Echo: ${message}`);
    });

    socket.on('close', () => {
      console.log('Client disconnected');
    });
  });

  return new Promise(() => {}); // Предотвращаем автоматический ответ
});
