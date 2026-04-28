import { connect, disconnect, on, off, emit, initPusher } from './pusher';

export const connectSocket = (token: string) => {
  initPusher(token);
  connect();
};

export const disconnectSocket = () => {
  disconnect();
};

export const socket = {
  on,
  off,
  emit,
  connect: () => connect(),
  disconnect: () => disconnect(),
  connected: true,
};

export default socket;
