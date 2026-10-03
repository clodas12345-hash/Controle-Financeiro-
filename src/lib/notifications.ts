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

const REMINDER_NOTIFICATION_BASE_ID = 8000;
const REMINDER_COUNT = 12; // 12 agendamentos de 2h = 24h de lembretes automáticos

export async function cancelDueBillsReminders(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const idsToCancel = [];
      for (let i = 1; i <= REMINDER_COUNT; i++) {
        idsToCancel.push({ id: REMINDER_NOTIFICATION_BASE_ID + i });
      }
      await LocalNotifications.cancel({ notifications: idsToCancel });
    } catch (err) {
      console.warn('Erro ao cancelar lembretes recorrentes:', err);
    }
  }
  localStorage.removeItem('fin_control_last_due_reminder_time');
}

export async function syncDueBillsRecurringReminders(dueCount: number, billNames?: string[]): Promise<void> {
  if (dueCount <= 0) {
    await cancelDueBillsReminders();
    return;
  }

  const namesText = billNames && billNames.length > 0
    ? ` (${billNames.slice(0, 2).join(', ')}${billNames.length > 2 ? '...' : ''})`
    : '';
  const notificationBody = `Você tem ${dueCount} conta(s) pendente(s) hoje${namesText}. Não se esqueça de quitá-las e marcar como pago!`;

  if (Capacitor.isNativePlatform()) {
    try {
      // Cancel previous scheduled reminders before rescheduling
      const idsToCancel = [];
      for (let i = 1; i <= REMINDER_COUNT; i++) {
        idsToCancel.push({ id: REMINDER_NOTIFICATION_BASE_ID + i });
      }
      await LocalNotifications.cancel({ notifications: idsToCancel });

      // Reschedule reminders every 2 hours
      const twoHoursMs = 2 * 60 * 60 * 1000;
      const now = Date.now();
      const newNotifications = [];

      for (let i = 1; i <= REMINDER_COUNT; i++) {
        newNotifications.push({
          id: REMINDER_NOTIFICATION_BASE_ID + i,
          title: '⏰ Lembrete: Contas a Pagar',
          body: notificationBody,
          schedule: { at: new Date(now + i * twoHoursMs) },
          smallIcon: 'ic_stat_icon',
          iconColor: '#34d399',
          sound: 'default',
        });
      }

      await LocalNotifications.schedule({ notifications: newNotifications });
    } catch (err) {
      console.warn('Erro ao agendar lembretes a cada 2h:', err);
    }
  }
}
