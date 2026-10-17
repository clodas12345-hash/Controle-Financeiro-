import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { LOGO_BASE_64 } from './logoBase64';

export async function initNotificationChannel(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.createChannel({
        id: 'padrao',
        name: 'Notificações Padrão',
        description: 'Canal de notificações padrão do app',
        importance: 5,
        visibility: 1,
        vibration: true,
      });

      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'BILL_REMINDER_ACTIONS',
            actions: [
              {
                id: 'mark_paid',
                title: '✅ Marcar como Paga',
                input: false,
              },
            ],
          },
        ],
      });

      console.log('Canal de notificação e Ações configurados com sucesso.');
    } catch (err) {
      console.warn('Erro ao configurar canal ou ações de notificação:', err);
    }
  }
}

export async function requestBatteryOptimizationExemption(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const exactStatus = await LocalNotifications.checkExactNotificationSetting();
    if (exactStatus.exact_alarm !== 'granted') {
      await LocalNotifications.changeExactNotificationSetting();
    }
  } catch (err) {
    console.warn('Exact alarm setting error:', err);
  }


}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await LocalNotifications.requestPermissions();
      const granted = status.display === 'granted';

      if (granted) {
        await initNotificationChannel();
        await requestBatteryOptimizationExemption();
      }

      return granted;
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
      await initNotificationChannel();
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body: options?.body || '',
            id: options?.id || Math.floor(Math.random() * 1000000) + 1,
            channelId: 'padrao',
            actionTypeId: 'BILL_REMINDER_ACTIONS',
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_stat_icon',
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

export async function checkExactAlarmSetting(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const res = await LocalNotifications.checkExactNotificationSetting();
    return res.exact_alarm === 'granted';
  } catch (e) {
    return true;
  }
}

export async function openExactAlarmSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.changeExactNotificationSetting();
  } catch (e) {
    console.warn('Error opening exact alarm settings:', e);
  }
}

export async function scheduleTestNotification(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannel();
      const id = Math.floor(Math.random() * 1000000) + 1;
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title: 'Teste de Lembrete',
            body: 'Arraste a notificação para baixo para ver o botão "Marcar como Paga".',
            channelId: 'padrao',
            actionTypeId: 'BILL_REMINDER_ACTIONS',
            smallIcon: 'ic_stat_icon',
            largeIcon: 'ic_stat_icon',
            schedule: {
              at: new Date(Date.now() + 5000),
              allowWhileIdle: true,
            },
            isExactNotification: true,
            sound: 'default',
          }
        ]
      });
      console.log('Notificação de teste com ação agendada com sucesso.');
    } catch (err) {
      console.warn('Erro ao agendar notificação de teste:', err);
    }
  }
}

const REMINDER_NOTIFICATION_BASE_ID = 8000;
const REMINDER_COUNT = 12; // 12 agendamentos cobrindo múltiplos dias para garantir funcionamento com app fechado

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
  const notificationBody = `Você tem ${dueCount} conta(s) pendente(s)${namesText}. Arraste para baixo e toque em "Marcar como Paga" para quitar!`;

  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannel();

      // Cancel previous scheduled reminders before rescheduling
      const idsToCancel = [];
      for (let i = 1; i <= REMINDER_COUNT; i++) {
        idsToCancel.push({ id: REMINDER_NOTIFICATION_BASE_ID + i });
      }
      await LocalNotifications.cancel({ notifications: idsToCancel });

      const now = Date.now();
      const checkHours = [9, 13, 18, 21]; // 4 fixed clock slots per day
      const newNotifications = [];
      let idx = 1;

      // Schedule across today and next 2 days so alarms persist even if app is closed for 48h
      for (let dayOffset = 0; dayOffset < 3 && idx <= REMINDER_COUNT; dayOffset++) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + dayOffset);

        for (const h of checkHours) {
          const checkTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), h, 0, 0);
          if (checkTime.getTime() > now && idx <= REMINDER_COUNT) {
            newNotifications.push({
              id: REMINDER_NOTIFICATION_BASE_ID + idx++,
              title: '⏰ Lembrete: Contas a Pagar',
              body: notificationBody,
              schedule: {
                at: checkTime,
                allowWhileIdle: true,
              },
              isExactNotification: true,
              channelId: 'padrao',
              actionTypeId: 'BILL_REMINDER_ACTIONS',
              smallIcon: 'ic_stat_icon',
              largeIcon: 'ic_stat_icon',
              sound: 'default',
            });
          }
        }
      }

      if (newNotifications.length > 0) {
        await LocalNotifications.schedule({ notifications: newNotifications });
        console.log(`Agendados ${newNotifications.length} lembretes nativos com ação "Marcar como Paga".`);
      }
    } catch (err) {
      console.warn('Erro ao agendar lembretes multidia com ação:', err);
    }
  }
}
