import { io } from 'socket.io-client';

// In development, the socket server is at the same origin
const SOCKET_URL = window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export const connectSocket = (token: string) => {
  if (socket.connected) return;
  socket.connect();
  socket.emit('authenticate', token);
};

export const disconnectSocket = () => {
  socket.disconnect();
};
