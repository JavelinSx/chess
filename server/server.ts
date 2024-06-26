import app from './app';
import { config } from './config/config';
import { Server } from 'socket.io';
import http from 'http';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinGame', (gameId) => {
    socket.join(gameId);
  });

  socket.on('move', (data) => {
    io.to(data.gameId).emit('moveMade', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
