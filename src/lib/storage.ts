import { Transaction, Bill, HomeUtilityReading, HomeTask, MonthlyBudget, Pet, PetCareRecord, ModuleId, CompanyProfile, CompanyClient, CompanyDocument } from '../types';
import {
  initialHomeReadings,
  initialHomeTasks,
  initialBills,
  initialTransactions,
  initialBudgets,
} from '../data/initialData';

const KEYS = {
  TRANSACTIONS: 'fin_control_transactions_v1',
  BILLS: 'fin_control_bills_v1',
  VEHICLES: 'fin_control_vehicles_v1',
  VEHICLE_SERVICES: 'fin_control_vservices_v1',
  HOME_READINGS: 'fin_control_hreadings_v1',
  HOME_TASKS: 'fin_control_htasks_v1',
  BUDGETS: 'fin_control_budgets_v1',
  DAILY_LOGS: 'fin_control_dailylogs_v1',
  CREDIT_CARDS: 'fin_control_credit_cards_v1',
  PETS: 'fin_control_pets_v1',
  PET_CARE: 'fin_control_pet_care_v1',
  ENABLED_MODULES: 'fin_control_enabled_modules_v1',
  COMPANY_PROFILE: 'fin_control_company_profile_v1',
  COMPANY_CLIENTS: 'fin_control_company_clients_v1',
  COMPANY_DOCUMENTS: 'fin_control_company_documents_v1',
  INCOME_PROFILE: 'fin_control_income_profile_v1',
};

export const DEFAULT_INITIAL_COMPANY_PROFILE: CompanyProfile = {
  name: 'Minha Empresa Serviços & Soluções',
  tradingName: 'Minha Empresa Tech',
  document: '12.345.678/0001-90',
  phone: '(11) 98765-4321',
  email: 'contato@minhaempresa.com.br',
  address: 'Av. Paulista, 1000 - Sala 42 - São Paulo / SP',
  pixKey: 'contato@minhaempresa.com.br',
  bankDetails: 'Banco Inter (077) - Ag: 0001 - Conta: 123456-7',
  notes: 'Obrigado por escolher nossos serviços! Dúvidas ou suporte comercial através do WhatsApp.',
};

export const DEFAULT_INITIAL_COMPANY_CLIENTS: CompanyClient[] = [];

export const DEFAULT_INITIAL_COMPANY_DOCUMENTS: CompanyDocument[] = [];

export const DEFAULT_INITIAL_PETS: Pet[] = [];

export const DEFAULT_INITIAL_PET_CARE: PetCareRecord[] = [];

export const DEFAULT_ENABLED_MODULES: ModuleId[] = [
  'contas',
  'entradas',
  'resumo',
  'relatorios',
];

export function loadData<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return fallback;
  }
}

export function saveData<T>(key: string, value: T): void {
  try {
    console.log(`Saving to localStorage: ${key}`, value);
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

export function loadAllAppData() {
  const loadOrInitial = <T>(key: string, initial: T): T => {
    const stored = localStorage.getItem(key);
    if (stored === null) return initial;
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error(`Error parsing ${key} from localStorage:`, error);
      return initial;
    }
  };

  const ensuredBills = loadOrInitial<Bill[]>(KEYS.BILLS, initialBills);
  const ensuredTransactions = loadOrInitial<Transaction[]>(KEYS.TRANSACTIONS, initialTransactions);
  const loadedModules = loadData<ModuleId[]>(KEYS.ENABLED_MODULES, DEFAULT_ENABLED_MODULES).filter(
    (m) => m !== ('diario' as any) && m !== ('carro' as any)
  );

  if (!loadedModules.includes('entradas')) {
    const contasIndex = loadedModules.indexOf('contas');
    if (contasIndex !== -1) {
      loadedModules.splice(contasIndex + 1, 0, 'entradas');
    } else {
      loadedModules.splice(1, 0, 'entradas');
    }
  }

  return {
    transactions: ensuredTransactions,
    bills: ensuredBills,
    homeReadings: loadOrInitial<HomeUtilityReading[]>(KEYS.HOME_READINGS, initialHomeReadings),
    homeTasks: loadOrInitial<HomeTask[]>(KEYS.HOME_TASKS, initialHomeTasks),
    budgets: loadOrInitial<MonthlyBudget[]>(KEYS.BUDGETS, initialBudgets),
    creditCards: loadOrInitial<any[]>(KEYS.CREDIT_CARDS, []),
    pets: loadOrInitial<Pet[]>(KEYS.PETS, DEFAULT_INITIAL_PETS),
    petCareRecords: loadOrInitial<PetCareRecord[]>(KEYS.PET_CARE, DEFAULT_INITIAL_PET_CARE),
    companyProfile: loadOrInitial<CompanyProfile>(KEYS.COMPANY_PROFILE, DEFAULT_INITIAL_COMPANY_PROFILE),
    companyClients: loadOrInitial<CompanyClient[]>(KEYS.COMPANY_CLIENTS, DEFAULT_INITIAL_COMPANY_CLIENTS),
    companyDocuments: loadOrInitial<CompanyDocument[]>(KEYS.COMPANY_DOCUMENTS, DEFAULT_INITIAL_COMPANY_DOCUMENTS),
    vehicles: loadOrInitial<any[]>(KEYS.VEHICLES, []),
    vehicleServices: loadOrInitial<any[]>(KEYS.VEHICLE_SERVICES, []),
    enabledModules: loadedModules,
  };
}

export function saveAllAppData(data: {
  transactions?: Transaction[];
  bills?: Bill[];
  vehicles?: any[];
  vehicleServices?: any[];
  homeReadings?: HomeUtilityReading[];
  homeTasks?: HomeTask[];
  budgets?: MonthlyBudget[];
  creditCards?: any[];
  pets?: Pet[];
  petCareRecords?: PetCareRecord[];
  companyProfile?: CompanyProfile;
  companyClients?: CompanyClient[];
  companyDocuments?: CompanyDocument[];
  enabledModules?: ModuleId[];
}) {
  if (data.transactions !== undefined) saveData(KEYS.TRANSACTIONS, data.transactions);
  if (data.bills !== undefined) saveData(KEYS.BILLS, data.bills);
  if (data.vehicles !== undefined) saveData(KEYS.VEHICLES, data.vehicles);
  if (data.vehicleServices !== undefined) saveData(KEYS.VEHICLE_SERVICES, data.vehicleServices);
  if (data.homeReadings !== undefined) saveData(KEYS.HOME_READINGS, data.homeReadings);
  if (data.homeTasks !== undefined) saveData(KEYS.HOME_TASKS, data.homeTasks);
  if (data.budgets !== undefined) saveData(KEYS.BUDGETS, data.budgets);
  if (data.creditCards !== undefined) saveData(KEYS.CREDIT_CARDS, data.creditCards);
  if (data.pets !== undefined) saveData(KEYS.PETS, data.pets);
  if (data.petCareRecords !== undefined) saveData(KEYS.PET_CARE, data.petCareRecords);
  if (data.companyProfile !== undefined) saveData(KEYS.COMPANY_PROFILE, data.companyProfile);
  if (data.companyClients !== undefined) saveData(KEYS.COMPANY_CLIENTS, data.companyClients);
  if (data.companyDocuments !== undefined) saveData(KEYS.COMPANY_DOCUMENTS, data.companyDocuments);
  if (data.enabledModules !== undefined) saveData(KEYS.ENABLED_MODULES, data.enabledModules);
}

export function clearAllManualData() {
  saveData(KEYS.TRANSACTIONS, []);
  saveData(KEYS.BILLS, []);
  saveData(KEYS.HOME_READINGS, []);
  saveData(KEYS.HOME_TASKS, []);
  saveData(KEYS.BUDGETS, []);
  saveData(KEYS.CREDIT_CARDS, []);
  saveData(KEYS.PETS, []);
  saveData(KEYS.PET_CARE, []);
  saveData(KEYS.COMPANY_CLIENTS, []);
  saveData(KEYS.COMPANY_DOCUMENTS, []);
  
  return loadAllAppData();
}

export function resetToDefaults() {
  localStorage.removeItem(KEYS.TRANSACTIONS);
  localStorage.removeItem(KEYS.BILLS);
  localStorage.removeItem(KEYS.VEHICLES);
  localStorage.removeItem(KEYS.VEHICLE_SERVICES);
  localStorage.removeItem(KEYS.HOME_READINGS);
  localStorage.removeItem(KEYS.HOME_TASKS);
  localStorage.removeItem(KEYS.BUDGETS);
  localStorage.removeItem(KEYS.DAILY_LOGS);
  localStorage.removeItem(KEYS.CREDIT_CARDS);
  localStorage.removeItem(KEYS.PETS);
  localStorage.removeItem(KEYS.PET_CARE);
  localStorage.removeItem(KEYS.COMPANY_PROFILE);
  localStorage.removeItem(KEYS.COMPANY_CLIENTS);
  localStorage.removeItem(KEYS.COMPANY_DOCUMENTS);
  localStorage.removeItem(KEYS.ENABLED_MODULES);
}

export interface ResetCategorySelection {
  transactions: boolean;
  bills: boolean;
  homeReadings: boolean;
  homeTasks: boolean;
  budgets: boolean;
  pets?: boolean;
  company?: boolean;
  vehicles?: boolean;
  dailyLogs?: boolean;
}

export function resetSelectedCategories(
  selection: ResetCategorySelection,
  mode: 'clear' | 'demo' = 'clear'
) {
  if (mode === 'clear') {
    if (selection.transactions) saveData(KEYS.TRANSACTIONS, []);
    if (selection.bills) saveData(KEYS.BILLS, []);
    if (selection.homeReadings) saveData(KEYS.HOME_READINGS, []);
    if (selection.homeTasks) saveData(KEYS.HOME_TASKS, []);
    if (selection.budgets) saveData(KEYS.BUDGETS, []);
    if (selection.pets) {
      saveData(KEYS.PETS, []);
      saveData(KEYS.PET_CARE, []);
    }
    if (selection.company) {
      saveData(KEYS.COMPANY_CLIENTS, []);
      saveData(KEYS.COMPANY_DOCUMENTS, []);
    }
    if (selection.vehicles) {
      saveData(KEYS.VEHICLES, []);
      saveData(KEYS.VEHICLE_SERVICES, []);
    }
  } else {
    if (selection.transactions) localStorage.removeItem(KEYS.TRANSACTIONS);
    if (selection.bills) localStorage.removeItem(KEYS.BILLS);
    if (selection.homeReadings) localStorage.removeItem(KEYS.HOME_READINGS);
    if (selection.homeTasks) localStorage.removeItem(KEYS.HOME_TASKS);
    if (selection.budgets) localStorage.removeItem(KEYS.BUDGETS);
    if (selection.pets) {
      localStorage.removeItem(KEYS.PETS);
      localStorage.removeItem(KEYS.PET_CARE);
    }
    if (selection.company) {
      localStorage.removeItem(KEYS.COMPANY_CLIENTS);
      localStorage.removeItem(KEYS.COMPANY_DOCUMENTS);
      localStorage.removeItem(KEYS.COMPANY_PROFILE);
    }
    if (selection.vehicles) {
      localStorage.removeItem(KEYS.VEHICLES);
      localStorage.removeItem(KEYS.VEHICLE_SERVICES);
    }
  }
}

export function formatBRL(amount: number): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeAmount);
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function getTodayStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateCurrentInstallment(startDate: string, totalInstallments: number): number {
  if (!startDate) return 1;
  const parts = startDate.split('T')[0].split('-').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 1;
  const startYear = parts[0];
  const startMonth = parts[1] - 1; // 0-indexed
  const now = new Date();
  
  const diffYears = now.getFullYear() - startYear;
  const diffMonths = now.getMonth() - startMonth;
  
  const monthsElapsed = diffYears * 12 + diffMonths;
  const current = 1 + monthsElapsed;
  
  return Math.min(Math.max(current, 1), totalInstallments);
}

export function addMonthsToDateString(dateStr: string, monthsToAdd: number): string {
  if (!dateStr) dateStr = getTodayStr();
  const cleanDate = dateStr.split('T')[0];
  const [year, month, day] = cleanDate.split('-').map(Number);
  if (!year || !month || !day) return getTodayStr();

  const totalMonths = (year * 12 + (month - 1)) + monthsToAdd;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (((totalMonths % 12) + 12) % 12) + 1;
  
  const maxDays = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, maxDays);
  
  const yStr = String(targetYear);
  const mStr = String(targetMonth).padStart(2, '0');
  const dStr = String(targetDay).padStart(2, '0');
  return `${yStr}-${mStr}-${dStr}`;
}

export type IncomeProfile = 'clt' | 'mei';

export function getIncomeProfile(): IncomeProfile {
  const val = localStorage.getItem(KEYS.INCOME_PROFILE);
  return val === 'mei' ? 'mei' : 'clt';
}

export function setIncomeProfile(profile: IncomeProfile): void {
  localStorage.setItem(KEYS.INCOME_PROFILE, profile);
}
