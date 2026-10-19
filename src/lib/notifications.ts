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
const MAX_REMINDER_IDS = 150;

export async function cancelDueBillsReminders(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const idsToCancel = [];
      for (let i = 1; i <= MAX_REMINDER_IDS; i++) {
        idsToCancel.push({ id: REMINDER_NOTIFICATION_BASE_ID + i });
      }
      await LocalNotifications.cancel({ notifications: idsToCancel });
    } catch (err) {
      console.warn('Erro ao cancelar lembretes recorrentes:', err);
    }
  }
  localStorage.removeItem('fin_control_last_due_reminder_time');
}

export async function syncDueBillsRecurringReminders(dueBills: any[], dueTransactions: any[]): Promise<void> {
  const allItems = [
    ...(dueBills || []).map(b => ({ id: b.id, title: b.title, amount: b.amount, dueDate: b.dueDate, type: 'bill' })),
    ...(dueTransactions || []).map(t => ({ id: t.id, title: t.description || 'Despesa', amount: t.amount, dueDate: t.date, type: 'tx' }))
  ];

  if (allItems.length === 0) {
    await cancelDueBillsReminders();
    return;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      await initNotificationChannel();

      // Cancel previous scheduled reminders before rescheduling
      const idsToCancel = [];
      for (let i = 1; i <= MAX_REMINDER_IDS; i++) {
        idsToCancel.push({ id: REMINDER_NOTIFICATION_BASE_ID + i });
      }
      await LocalNotifications.cancel({ notifications: idsToCancel });

      const now = Date.now();
      const checkHours = [9, 13, 18, 21]; // 4 fixed clock slots per day
      const newNotifications = [];
      let globalIdx = 1;

      const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

      // For each item, schedule across today and next 2 days
      allItems.forEach((item) => {
        const amountFormatted = currencyFormatter.format(item.amount);
        const title = `⏰ Conta Vencendo: ${item.title}`;
        const body = `Valor: ${amountFormatted} - Vencimento: ${item.dueDate}. Toque em "Marcar como Paga" para quitar!`;

        for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + dayOffset);

          for (const h of checkHours) {
            const checkTime = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), h, 0, 0);
            if (checkTime.getTime() > now && globalIdx <= MAX_REMINDER_IDS) {
              newNotifications.push({
                id: REMINDER_NOTIFICATION_BASE_ID + globalIdx++,
                title,
                body,
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
      });

      if (newNotifications.length > 0) {
        await LocalNotifications.schedule({ notifications: newNotifications });
        console.log(`Agendados ${newNotifications.length} lembretes individuais para ${allItems.length} contas.`);
      }
    } catch (err) {
      console.warn('Erro ao agendar lembretes individuais de contas:', err);
    }
  }
}
