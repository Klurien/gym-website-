/// <reference types="vite/client" />
import Pusher from 'pusher-js';

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || 'demo-key';
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'us2';

let pusher: Pusher | null = null;
const eventListeners: Record<string, Record<string, (data: any) => void>> = {};

export const initPusher = (token: string) => {
  if (pusher) return pusher;
  
  pusher = new Pusher(PUSHER_KEY, {
    cluster: PUSHER_CLUSTER,
  });

  pusher.connection.bind('connected', () => {
    console.log('Pusher connected');
  });

  return pusher;
};

export const connect = () => {
  if (!pusher) {
    initPusher('');
  }
};

export const disconnect = () => {
  if (pusher) {
    pusher.disconnect();
    pusher = null;
  }
};

export const emit = (event: string, data: any) => {
  fetch('/api/pusher-trigger', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: 'gym-chat',
      event,
      data,
    }),
  }).catch(console.error);
};

export const on = (event: string, callback: (data: any) => void) => {
  if (!pusher) {
    initPusher('');
  }
  
  const channel = pusher!.subscribe('gym-chat');
  channel.bind(event, callback);
  
  if (!eventListeners[event]) {
    eventListeners[event] = {};
  }
  eventListeners[event][callback.name || 'anonymous'] = callback;
};

export const off = (event: string, callback?: (data: any) => void) => {
  if (!pusher) return;
  
  const channel = pusher.subscribe('gym-chat');
  if (callback) {
    channel.unbind(event, callback);
    delete eventListeners[event]?.[callback.name || 'anonymous'];
  } else {
    channel.unbind(event);
    delete eventListeners[event];
  }
};

export const socket = {
  on,
  off,
  emit,
  connect,
  disconnect,
  connected: true,
};

export default socket;
