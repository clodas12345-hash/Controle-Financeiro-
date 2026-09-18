import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { loadAllAppData, loadData, saveData, getIncomeProfile, setIncomeProfile, DEFAULT_INITIAL_COMPANY_PROFILE, DEFAULT_ENABLED_MODULES } from './storage';
import { exportAppToExcel } from './excelExport';

export interface BackupPayload {
  version: string;
  appName: string;
  exportDate: string;
  timestamp: number;
  summary: {
    transactionsCount: number;
    billsCount: number;
    creditCardsCount: number;
    vehiclesCount: number;
    vehicleServicesCount: number;
    homeReadingsCount: number;
    homeTasksCount: number;
    budgetsCount: number;
    petsCount: number;
    companyClientsCount: number;
    companyDocumentsCount: number;
    totalRecords: number;
  };
  data: {
    transactions: any[];
    bills: any[];
    creditCards: any[];
    vehicles: any[];
    vehicleServices: any[];
    homeReadings: any[];
    homeTasks: any[];
    budgets: any[];
    pets: any[];
    petCareRecords: any[];
    companyProfile: any;
    companyClients: any[];
    companyDocuments: any[];
    enabledModules: any[];
    incomeProfile: string;
    dailyLogs: any[];
    soundSettings: {
      preferredSound: string;
      soundEnabled: boolean;
    };
    [key: string]: any;
  };
}

/**
 * Generates full backup payload from active memory and localStorage
 */
export function generateFullBackupPayload(appData?: ReturnType<typeof loadAllAppData>): BackupPayload {
  const current = appData || loadAllAppData();
  
  const transactions = current.transactions || [];
  const bills = current.bills || [];
  const creditCards = current.creditCards || [];
  const vehicles = current.vehicles || [];
  const vehicleServices = current.vehicleServices || [];
  const homeReadings = current.homeReadings || [];
  const homeTasks = current.homeTasks || [];
  const budgets = current.budgets || [];
  const pets = current.pets || [];
  const petCareRecords = current.petCareRecords || [];
  const companyProfile = current.companyProfile || DEFAULT_INITIAL_COMPANY_PROFILE;
  const companyClients = current.companyClients || [];
  const companyDocuments = current.companyDocuments || [];
  const enabledModules = current.enabledModules || DEFAULT_ENABLED_MODULES;
  const incomeProfile = getIncomeProfile();
  const dailyLogs = loadData('fin_control_dailylogs_v1', []);
  const preferredSound = localStorage.getItem('fin_control_preferred_sound') || 'modern';
  const soundEnabled = localStorage.getItem('fin_control_sound_enabled') !== 'false';

  // Fallback: Backup any other fin_control_ keys in localStorage to ensure NOTHING is missed
  const extraStorage: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('fin_control_')) {
      extraStorage[key] = localStorage.getItem(key) || '';
    }
  }

  const totalRecords =
    transactions.length +
    bills.length +
    creditCards.length +
    vehicles.length +
    vehicleServices.length +
    homeReadings.length +
    homeTasks.length +
    budgets.length +
    pets.length +
    petCareRecords.length +
    companyClients.length +
    companyDocuments.length +
    dailyLogs.length;

  return {
    version: 'CF_V2.0.0',
    appName: 'Controle Financeiro',
    exportDate: new Date().toISOString(),
    timestamp: Date.now(),
    summary: {
      transactionsCount: transactions.length,
      billsCount: bills.length,
      creditCardsCount: creditCards.length,
      vehiclesCount: vehicles.length,
      vehicleServicesCount: vehicleServices.length,
      homeReadingsCount: homeReadings.length,
      homeTasksCount: homeTasks.length,
      budgetsCount: budgets.length,
      petsCount: pets.length,
      companyClientsCount: companyClients.length,
      companyDocumentsCount: companyDocuments.length,
      totalRecords,
    },
    data: {
      transactions,
      bills,
      creditCards,
      vehicles,
      vehicleServices,
      homeReadings,
      homeTasks,
      budgets,
      pets,
      petCareRecords,
      companyProfile,
      companyClients,
      companyDocuments,
      enabledModules,
      incomeProfile,
      dailyLogs,
      soundSettings: {
        preferredSound,
        soundEnabled,
      },
      extraStorage,
    },
  };
}

/**
 * Universal safe copy to clipboard with fallback for Android WebView and iframe contexts
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      console.warn('navigator.clipboard.writeText failed, trying textarea fallback:', e);
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error('Fallback execCommand copy failed:', err);
    return false;
  }
}

export interface UniversalBackupResult {
  success: boolean;
  filename: string;
  totalRecords: number;
  method: 'shared' | 'downloaded' | 'clipboard';
  message: string;
}

/**
 * Universal export function that works on Android APK, iOS, and desktop browsers.
 * Prioritizes Web Share API (native share sheet: WhatsApp, Drive, Files) on mobile,
 * with graceful fallback to browser download and clipboard.
 */
export async function exportFullBackupUniversal(
  appData?: ReturnType<typeof loadAllAppData>,
  mode: 'download' | 'share' = 'share'
): Promise<UniversalBackupResult> {
  const payload = generateFullBackupPayload(appData);
  const jsonStr = JSON.stringify(payload, null, 2);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  const filename = `Controle_Financeiro_Backup_${yyyy}-${mm}-${dd}_${hh}h${min}.json`;
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });

  if (Capacitor.isNativePlatform()) {
    try {
      // Directory.Cache does NOT require dangerous public storage permissions on Android 10/11/12/13/14+
      const result = await Filesystem.writeFile({
        path: filename,
        data: jsonStr,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: 'Backup Controle Financeiro',
        text: `Backup com todos os dados (${payload.summary.totalRecords} registros) gerado em ${now.toLocaleDateString('pt-BR')}.`,
        url: result.uri,
        files: [result.uri],
        dialogTitle: 'Compartilhar Backup',
      });

      return {
        success: true,
        filename,
        totalRecords: payload.summary.totalRecords,
        method: 'shared',
        message: 'Menu de compartilhamento aberto! Escolha Salvar no Dispositivo, WhatsApp ou Google Drive.',
      };
    } catch (err: any) {
      console.warn('Native share/write fallback:', err);
      // Let it fall back seamlessly to browser/webview download without throwing a blocking error
    }
  }

  // 1. On Android / iOS, try native Web Share API
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], filename, { type: 'application/json' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Backup Controle Financeiro',
          text: `Backup com todos os dados (${payload.summary.totalRecords} registros) gerado em ${now.toLocaleDateString('pt-BR')}.`,
          files: [file],
        });
        return {
          success: true,
          filename,
          totalRecords: payload.summary.totalRecords,
          method: 'shared',
          message: `Backup salvo na pasta Downloads do seu celular! Você também pode compartilhar agora.`,
        };
      }
    } catch (shareErr: any) {
      if (shareErr.name === 'AbortError') {
        return {
          success: true,
          filename,
          totalRecords: payload.summary.totalRecords,
          method: 'shared',
          message: 'Compartilhamento cancelado.',
        };
      }
      console.warn('Native file share failed, falling back to download:', shareErr);
    }
  }

  // 2. Direct browser download
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 1500);

    return {
      success: true,
      filename,
      totalRecords: payload.summary.totalRecords,
      method: 'downloaded',
      message: `Arquivo ${filename} (${payload.summary.totalRecords} itens) exportado com sucesso!`,
    };
  } catch (downloadErr) {
    console.warn('Direct download link failed, falling back to clipboard:', downloadErr);
  }

  // 3. Fallback: Copy to clipboard
  const copied = await copyTextToClipboard(jsonStr);
  if (copied) {
    return {
      success: true,
      filename,
      totalRecords: payload.summary.totalRecords,
      method: 'clipboard',
      message: 'Código completo do backup copiado para a área de transferência!',
    };
  }

  throw new Error('Não foi possível exportar nem copiar o arquivo de backup.');
}

/**
 * Downloads the full backup immediately as a JSON file (backward compatible)
 */
export function downloadFullBackupImmediately(appData?: ReturnType<typeof loadAllAppData>): {
  filename: string;
  totalRecords: number;
} {
  const payload = generateFullBackupPayload(appData);
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');

  const filename = `Controle_Financeiro_Backup_${yyyy}-${mm}-${dd}_${hh}h${min}.json`;

  // Trigger download link
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (e) {
    console.warn('Download link error:', e);
  }

  return {
    filename,
    totalRecords: payload.summary.totalRecords,
  };
}

export interface RestorePoint {
  id: string;
  date: string;
  timestamp: number;
  label: string;
  totalRecords: number;
  data: BackupPayload['data'];
}

/**
 * Saves an automatic snapshot in local storage so users can always recover their data
 */
export function saveAutomaticRestorePoint(
  appData?: ReturnType<typeof loadAllAppData>,
  label: string = 'Ponto Automático'
): void {
  try {
    const payload = generateFullBackupPayload(appData);
    if (payload.summary.totalRecords === 0) return;

    const pointsRaw = localStorage.getItem('fin_control_restore_points_v1');
    let points: RestorePoint[] = pointsRaw ? JSON.parse(pointsRaw) : [];

    // Avoid duplicate snapshot within 2 minutes with identical record count
    const lastPoint = points[0];
    if (
      lastPoint &&
      Date.now() - lastPoint.timestamp < 120000 &&
      lastPoint.totalRecords === payload.summary.totalRecords
    ) {
      return;
    }

    const newPoint: RestorePoint = {
      id: `rp_${Date.now()}`,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      label,
      totalRecords: payload.summary.totalRecords,
      data: payload.data,
    };

    points = [newPoint, ...points.slice(0, 4)];
    localStorage.setItem('fin_control_restore_points_v1', JSON.stringify(points));
  } catch (err) {
    console.warn('Error saving automatic restore point:', err);
  }
}

/**
 * Returns all available automatic restore snapshots
 */
export function getAutomaticRestorePoints(): RestorePoint[] {
  try {
    const pointsRaw = localStorage.getItem('fin_control_restore_points_v1');
    return pointsRaw ? JSON.parse(pointsRaw) : [];
  } catch {
    return [];
  }
}

/**
 * Restores data from a specific snapshot
 */
export function restoreFromRestorePoint(pointId: string): {
  success: boolean;
  error?: string;
  restoredData?: ReturnType<typeof loadAllAppData>;
  restoredSummary?: {
    transactions: number;
    bills: number;
    creditCards: number;
    vehicles: number;
    total: number;
  };
} {
  try {
    const points = getAutomaticRestorePoints();
    const point = points.find((p) => p.id === pointId);
    if (!point) return { success: false, error: 'Ponto de restauração não encontrado.' };

    const rawJson = JSON.stringify({ data: point.data });
    return restoreFullBackupFromJSON(rawJson);
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao restaurar ponto.' };
  }
}

/**
 * Restores all application data from imported JSON
 */
export function restoreFullBackupFromJSON(rawJson: string): {
  success: boolean;
  restoredData?: ReturnType<typeof loadAllAppData>;
  restoredSummary?: {
    transactions: number;
    bills: number;
    creditCards: number;
    vehicles: number;
    total: number;
  };
  error?: string;
} {
  try {
    const trimmed = rawJson ? rawJson.trim() : '';
    if (trimmed.startsWith('PK') || trimmed.startsWith('PK\x03\x04') || trimmed.startsWith('PK\x05\x06')) {
      return {
        success: false,
        error: 'O arquivo selecionado é um arquivo compactado (ZIP). Por favor, selecione o arquivo de backup em formato JSON (.json) gerado pelo aplicativo.'
      };
    }

    const parsed = JSON.parse(trimmed);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Arquivo JSON inválido ou vazio.' };
    }

    // Support both new wrapped format and legacy direct format
    const sourceData = parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;

    const transactions = Array.isArray(sourceData.transactions) ? sourceData.transactions : [];
    const bills = Array.isArray(sourceData.bills) ? sourceData.bills : [];
    const creditCards = Array.isArray(sourceData.creditCards) ? sourceData.creditCards : [];
    const vehicles = Array.isArray(sourceData.vehicles) ? sourceData.vehicles : [];
    const vehicleServices = Array.isArray(sourceData.vehicleServices) ? sourceData.vehicleServices : [];
    const homeReadings = Array.isArray(sourceData.homeReadings) ? sourceData.homeReadings : [];
    const homeTasks = Array.isArray(sourceData.homeTasks) ? sourceData.homeTasks : [];
    const budgets = Array.isArray(sourceData.budgets) ? sourceData.budgets : [];
    const pets = Array.isArray(sourceData.pets) ? sourceData.pets : [];
    const petCareRecords = Array.isArray(sourceData.petCareRecords) ? sourceData.petCareRecords : [];
    const companyProfile = sourceData.companyProfile || DEFAULT_INITIAL_COMPANY_PROFILE;
    const companyClients = Array.isArray(sourceData.companyClients) ? sourceData.companyClients : [];
    const companyDocuments = Array.isArray(sourceData.companyDocuments) ? sourceData.companyDocuments : [];
    const enabledModules = Array.isArray(sourceData.enabledModules) ? sourceData.enabledModules : DEFAULT_ENABLED_MODULES;
    const dailyLogs = Array.isArray(sourceData.dailyLogs) ? sourceData.dailyLogs : [];

    // Save each key to localStorage
    saveData('fin_control_transactions_v1', transactions);
    saveData('fin_control_bills_v1', bills);
    saveData('fin_control_credit_cards_v1', creditCards);
    saveData('fin_control_vehicles_v1', vehicles);
    saveData('fin_control_vservices_v1', vehicleServices);
    saveData('fin_control_hreadings_v1', homeReadings);
    saveData('fin_control_htasks_v1', homeTasks);
    saveData('fin_control_budgets_v1', budgets);
    saveData('fin_control_pets_v1', pets);
    saveData('fin_control_pet_care_v1', petCareRecords);
    saveData('fin_control_company_profile_v1', companyProfile);
    saveData('fin_control_company_clients_v1', companyClients);
    saveData('fin_control_company_documents_v1', companyDocuments);
    saveData('fin_control_enabled_modules_v1', enabledModules);
    saveData('fin_control_dailylogs_v1', dailyLogs);

    if (sourceData.incomeProfile) {
      setIncomeProfile(sourceData.incomeProfile);
    }
    if (sourceData.soundSettings) {
      if (sourceData.soundSettings.preferredSound) {
        localStorage.setItem('fin_control_preferred_sound', sourceData.soundSettings.preferredSound);
      }
      if (sourceData.soundSettings.soundEnabled !== undefined) {
        localStorage.setItem('fin_control_sound_enabled', String(sourceData.soundSettings.soundEnabled));
      }
    }

    // Restore any extra raw storage elements (e.g. custom categories, suppress flags, dynamic options)
    if (sourceData.extraStorage && typeof sourceData.extraStorage === 'object') {
      Object.keys(sourceData.extraStorage).forEach((key) => {
        if (key.startsWith('fin_control_')) {
          localStorage.setItem(key, sourceData.extraStorage[key]);
        }
      });
    }

    const restoredData = loadAllAppData();
    const total = transactions.length + bills.length + creditCards.length + vehicles.length + homeReadings.length;

    return {
      success: true,
      restoredData,
      restoredSummary: {
        transactions: transactions.length,
        bills: bills.length,
        creditCards: creditCards.length,
        vehicles: vehicles.length,
        total,
      },
    };
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('JSON') || msg.includes('Unexpected token')) {
      return {
        success: false,
        error: 'O arquivo selecionado não é um arquivo JSON válido. Certifique-se de selecionar o arquivo de backup correto (.json).'
      };
    }
    return {
      success: false,
      error: 'Falha ao interpretar arquivo de backup: ' + msg,
    };
  }
}
