import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch (err) {
      console.warn('requestNotificationPermission falhou no Capacitor:', err);
      return false;
    }
  } else if ('Notification' in window) {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch (err) {
      console.warn('Notification.requestPermission falhou no Web:', err);
      return false;
    }
  }
  return false;
}

export async function sendAppNotification(title: string, options?: { body?: string; id?: number }) {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options?.body || '',
            id: options?.id || Math.floor(Math.random() * 1000000) + 1,
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_stat_large_icon',
            iconColor: '#34d399',
            sound: 'default'
          }
        ]
      });
      return;
    } catch (capErr) {
      console.warn('LocalNotifications.schedule falhou:', capErr);
    }
  } else if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: options?.body || '',
        icon: '/logo.png',
        badge: '/logo.png',
      });
    } catch (webErr) {
      console.warn('Web Notification falhou:', webErr);
    }
  }
}
