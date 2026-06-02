/// <reference types="vite/client" />

declare const PusherPushNotifications: {
  Client: new (config: { instanceId: string }) => {
    start: () => Promise<void>;
    addDeviceInterest: (interest: string) => Promise<void>;
  };
};

const PUSHER_BEAMS_INSTANCE_ID = import.meta.env.VITE_PUSHER_BEAMS_INSTANCE_ID || 'ca297b86-9f0a-4535-b4df-71387610989d';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function initPushNotifications() {
  if (typeof window === 'undefined') return null;
  
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return null;

  const beamsClient = new PusherPushNotifications.Client({
    instanceId: PUSHER_BEAMS_INSTANCE_ID,
  });

  try {
    await beamsClient.start();
    await beamsClient.addDeviceInterest('hello');
    console.log('Push notifications registered');
    return beamsClient;
  } catch (error) {
    console.error('Failed to init push notifications:', error);
    return null;
  }
}

export async function sendPushNotification(userId: number, title: string, message: string, url?: string) {
  try {
    const res = await fetch('/api/push-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, message, url }),
    });
    return res.json();
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

export { PUSHER_BEAMS_INSTANCE_ID };