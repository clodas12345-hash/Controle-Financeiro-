import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Home,
  Car,
  CalendarDays,
  Receipt,
  PieChart,
  Sparkles,
} from 'lucide-react';
import {
  loadAllAppData,
  saveAllAppData,
  clearAllManualData,
  resetToDefaults,
  resetSelectedCategories,
  ResetCategorySelection,
  calculateCurrentInstallment,
  getTodayStr,
  formatBRL,
  getEffectiveDueDate,
} from './lib/storage';
import { exportAppToExcel } from './lib/excelExport';
import { downloadFullBackupImmediately, restoreFullBackupFromJSON, saveAutomaticRestorePoint } from './lib/backupManager';
import {
  Transaction,
  Bill,
  HomeUtilityReading,
  HomeTask,
  MonthlyBudget,
  CategoryScope,
  TransactionCategory,
  TransactionType,
  ModuleId,
  isVariableBill,
  Vehicle,
  VehicleService
} from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BillsModule } from './components/BillsModule';
import { IncomesModule } from './components/IncomesModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { TransactionModal } from './components/TransactionModal';
import { BillModal } from './components/BillModal';
import { CalculatorsModal } from './components/CalculatorsModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { HelpModal } from './components/HelpModal';
import { ResetModal } from './components/ResetModal';
import { CreditCardsModal } from './components/CreditCardsModal';
import { DueBillsAlertModal } from './components/DueBillsAlertModal';
import { ModuleCustomizerModal } from './components/ModuleCustomizerModal';
import { NotificationsAndAuthorizationsModal } from './components/NotificationsAndAuthorizationsModal';
import { BackupModal } from './components/BackupModal';
import { MobileBottomNav } from './components/MobileBottomNav';

function getValidScope(scope?: string, category?: TransactionCategory, title?: string): CategoryScope {
  if (scope === 'casa') return 'casa';
  if (scope === 'pet') return 'pet';
  if (scope === 'pagamentos') return 'pagamentos';
  if (scope === 'empresa') return 'empresa';
  if (scope === 'geral') return 'geral';
  if (category && (category.includes('Pet') || category.includes('Veterinário') || category.includes('Banho'))) return 'pet';
  if (title) {
    const lowerTitle = title.toLowerCase();
    if (['pet', 'vet', 'racao', 'ração', 'vacina', 'cachorro', 'gato', 'tosa'].some((kw) => lowerTitle.includes(kw))) return 'pet';
  }
  return 'casa';
}

export default function App() {
  const [data, setData] = useState(() => loadAllAppData());
  const [activeTab, setActiveTab] = useState('contas');

  const handleSelectTab = useCallback((tab: string) => {
    if (tab === 'dashboard') {
      setActiveTab('resumo');
    } else {
      setActiveTab(tab);
    }
  }, []);

  // Modals & Editing state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultScopeForTransaction, setDefaultScopeForTransaction] = useState<CategoryScope>('geral');
  const [defaultCategoryForTransaction, setDefaultCategoryForTransaction] = useState<TransactionCategory>('Outros');
  const [defaultTypeForTransaction, setDefaultTypeForTransaction] = useState<TransactionType>('despesa');
  const [defaultDescriptionForTransaction, setDefaultDescriptionForTransaction] = useState<string>('');

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  const [isCalculatorsModalOpen, setIsCalculatorsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCreditCardsModalOpen, setIsCreditCardsModalOpen] = useState(false);
  const [isModuleCustomizerOpen, setIsModuleCustomizerOpen] = useState(false);
  const [isNotificationsAuthOpen, setIsNotificationsAuthOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const setEnabledModules = (action: React.SetStateAction<ModuleId[]>) => {
    setData((prev) => ({
      ...prev,
      enabledModules: typeof action === 'function' ? action(prev.enabledModules || []) : action,
    }));
  };

  // Migration & Battery Capacity persistence
  useEffect(() => {
    setData((prev) => {
      let currentData = { ...prev };
      let changed = false;

      // Deduplicate bills
      const uniqueBills = [];
      const billKeys = new Set();
      for (const bill of currentData.bills || []) {
        const key = `${bill.title}|${bill.amount}|${bill.dueDate}|${bill.category}|${bill.scope}`;
        if (!billKeys.has(key)) {
          billKeys.add(key);
          uniqueBills.push(bill);
        } else {
          changed = true;
        }
      }
      
      // Deduplicate transactions
      const uniqueTx = [];
      const txKeys = new Set();
      for (const tx of currentData.transactions || []) {
        const key = `${tx.description}|${tx.amount}|${tx.date}|${tx.category}|${tx.scope}|${tx.type}`;
        if (!txKeys.has(key)) {
          txKeys.add(key);
          uniqueTx.push(tx);
        } else {
          changed = true;
        }
      }

      if (changed) {
        currentData.bills = uniqueBills;
        currentData.transactions = uniqueTx;
      }

      return changed ? currentData : prev;
    });
  }, []);

  // Load local data from device storage on startup
  useEffect(() => {
    const localData = loadAllAppData();
    setData(localData);
  }, []);

  const handleConsolidateData = useCallback(() => {
    setData((prev) => {
      let currentData = { ...prev };
      let changed = false;
      
      const newBills = [...(currentData.bills || [])];
      let newTransactions = [...(currentData.transactions || [])];

      // 1. Sweep and Deduplicate Bills
      const uniqueBills = [];
      const billKeys = new Set();
      for (const bill of newBills) {
        const key = `${bill.title}|${bill.amount}|${bill.dueDate}|${bill.category}|${bill.scope}`;
        if (!billKeys.has(key)) {
          billKeys.add(key);
          uniqueBills.push(bill);
        } else {
          changed = true;
        }
      }

      // 2. Sweep and Deduplicate Transactions
      const uniqueTx = [];
      const txKeys = new Set();
      for (const tx of newTransactions) {
        const key = tx.id || `${tx.description}|${tx.amount}|${tx.date}|${tx.category}|${tx.scope}|${tx.type}`;
        if (!txKeys.has(key)) {
          txKeys.add(key);
          uniqueTx.push(tx);
        } else {
          changed = true;
        }
      }
      
      newTransactions = uniqueTx;

      // 3. Auto-roll monthly recurring bills for current month
      const currentMonthStr = getTodayStr().slice(0, 7);
      const recurringMonthlyMap = new Map<string, Bill[]>();
      for (const b of uniqueBills) {
        if (b.recurring === 'mensal') {
          const key = b.title.trim().toLowerCase();
          if (!recurringMonthlyMap.has(key)) {
            recurringMonthlyMap.set(key, []);
          }
          recurringMonthlyMap.get(key)!.push(b);
        }
      }

      recurringMonthlyMap.forEach((billsList) => {
        const sorted = [...billsList].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
        const previousBill = sorted.find((b) => !b.dueDate.startsWith(currentMonthStr)) || sorted[0];
        const currentBill = billsList.find((b) => b.dueDate.startsWith(currentMonthStr));

        if (currentBill) {
          // Fixed bills (NOT credit card or energy) maintain exact same value from previous month
          if (!isVariableBill(currentBill.title, currentBill.category) && previousBill && previousBill.id !== currentBill.id) {
            if (currentBill.amount !== previousBill.amount) {
              currentBill.amount = previousBill.amount;
              changed = true;
            }
          }
        } else if (previousBill) {
          const day = parseInt(previousBill.dueDate.split('-')[2] || '1', 10);
          const [year, month] = currentMonthStr.split('-').map(Number);
          const maxDays = new Date(year, month, 0).getDate();
          const targetDay = Math.min(day, maxDays);
          const newDueDate = `${currentMonthStr}-${String(targetDay).padStart(2, '0')}`;

          const newBill: Bill = {
            id: `bill_auto_m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: previousBill.title,
            amount: previousBill.amount,
            dueDate: newDueDate,
            category: previousBill.category,
            scope: previousBill.scope,
            paymentMethod: previousBill.paymentMethod,
            status: 'pendente',
            recurring: 'mensal',
            excludeFromTotals: previousBill.excludeFromTotals,
          };

          uniqueBills.push(newBill);
          changed = true;
        }
      });

      // 4. Sync Bills to Transactions
      for (const b of uniqueBills) {
        const autoTxId = `tx_auto_bill_${b.id}`;
        const existingTxIndex = newTransactions.findIndex((t) => t.id === autoTxId);

        if (b.status === 'pago') {
          const targetScope = getValidScope(b.scope, b.category, b.title);
          const autoTx: Transaction = {
            id: autoTxId,
            description: b.title,
            amount: b.amount,
            type: 'despesa',
            category: b.category,
            scope: targetScope,
            date: b.paidDate || b.dueDate || getTodayStr(),
            paymentMethod: b.paymentMethod,
            paid: true,
            excludeFromTotals: b.excludeFromTotals,
          };

          if (existingTxIndex >= 0) {
            const existing = newTransactions[existingTxIndex];
            if (
              existing.scope !== targetScope ||
              existing.amount !== b.amount ||
              existing.description !== b.title ||
              existing.category !== b.category ||
              existing.date !== autoTx.date
            ) {
              newTransactions[existingTxIndex] = autoTx;
              changed = true;
            }
          } else {
            newTransactions.push(autoTx);
            changed = true;
          }
        } else {
          // If not paid, ensure no transaction exists
          if (existingTxIndex >= 0) {
            newTransactions.splice(existingTxIndex, 1);
            changed = true;
          }
        }
      }

      if (changed) {
        currentData.bills = uniqueBills;
        currentData.transactions = newTransactions;
        console.log("Varredura de consolidação de dados concluída!");
      }

      return changed ? currentData : prev;
    });
  }, []);

  // Sync to localStorage on change - optimization: remove noisy logs
  useEffect(() => {
    saveAllAppData(data);
  }, [data]);

  const handleAddVehicle = (newVehicle: Omit<Vehicle, 'id'>) => {
    setData((prev) => ({
      ...prev,
      vehicles: [...(prev.vehicles || []), { ...newVehicle, id: Date.now().toString() }],
    }));
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setData((prev) => ({
      ...prev,
      vehicles: (prev.vehicles || []).map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v)),
    }));
  };

  const handleDeleteVehicle = (id: string) => {
    setData((prev) => ({
      ...prev,
      vehicles: (prev.vehicles || []).filter((v) => v.id !== id),
    }));
  };

  // Ensure sync across bills, transactions, homeReadings and vehicleServices on startup
  // Handler: Add or Edit Transaction
  const handleSaveTransaction = useCallback((txData: Omit<Transaction, 'id'>, existingId?: string) => {
    setData((prev) => {
      let updatedTransactions = [...(prev.transactions || [])];
      let updatedBills = [...(prev.bills || [])];
      let updatedServices = [...(prev.vehicleServices || [])];
      let updatedReadings = [...(prev.homeReadings || [])];

      let targetTxId = existingId;

      if (existingId) {
        updatedTransactions = updatedTransactions.map((t) =>
          t.id === existingId ? { ...txData, id: existingId } : t
        );

        // Sync back to linked source if auto transaction
        if (existingId.startsWith('tx_auto_bill_')) {
          const billId = existingId.replace('tx_auto_bill_', '');
          updatedBills = updatedBills.map((b) =>
            b.id === billId
              ? {
                  ...b,
                  title: txData.description,
                  amount: txData.amount,
                  category: txData.category,
                  scope: txData.scope,
                  paymentMethod: txData.paymentMethod,
                  excludeFromTotals: txData.excludeFromTotals,
                }
              : b
          );
        } else if (existingId.startsWith('tx_auto_svc_')) {
          const svcId = existingId.replace('tx_auto_svc_', '');
          updatedServices = updatedServices.map((s) =>
            s.id === svcId
              ? {
                  ...s,
                  cost: txData.amount,
                  title: txData.description.replace('Manutenção: ', ''),
                }
              : s
          );
        } else if (existingId.startsWith('tx_auto_reading_')) {
          const readingId = existingId.replace('tx_auto_reading_', '');
          updatedReadings = updatedReadings.map((r) =>
            r.id === readingId ? { ...r, cost: txData.amount } : r
          );
        }
      } else {
        targetTxId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const tx: Transaction = {
          ...txData,
          id: targetTxId,
        };
        updatedTransactions = [tx, ...updatedTransactions];
      }

      // Ensure bill sync if it's a house or car expense
      if (txData.type === 'despesa' && targetTxId) {
        const autoBillId = `bill_auto_tx_${targetTxId}`;
        const autoBill: Bill = {
          id: autoBillId,
          title: txData.description,
          amount: txData.amount,
          dueDate: txData.date,
          category: txData.category,
          scope: txData.scope,
          paymentMethod: txData.paymentMethod,
          status: txData.paid ? 'pago' : 'pendente',
          paidDate: txData.paid ? txData.date : undefined,
          recurring: txData.recurring ? 'mensal' : 'unico',
        };

        if (updatedBills.some((b) => b.id === autoBillId)) {
          updatedBills = updatedBills.map((b) => (b.id === autoBillId ? autoBill : b));
        } else if (txData.scope === 'casa') {
          updatedBills = [autoBill, ...updatedBills];
        }
      }

      const nextData = {
        ...prev,
        transactions: updatedTransactions,
        bills: updatedBills,
        homeReadings: updatedReadings,
      };
      saveAllAppData(nextData);
      return nextData;
    });
  }, []);

  // Handler: Direct Update Transaction
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setData((prev) => {
      const updatedTransactions = (prev.transactions || []).map((t) =>
        t.id === updatedTx.id ? updatedTx : t
      );
      let updatedBills = [...(prev.bills || [])];
      let updatedServices = [...(prev.vehicleServices || [])];
      let updatedReadings = [...(prev.homeReadings || [])];

      if (updatedTx.id.startsWith('tx_auto_bill_')) {
        const billId = updatedTx.id.replace('tx_auto_bill_', '');
        updatedBills = updatedBills.map((b) =>
          b.id === billId
            ? {
                ...b,
                title: updatedTx.description,
                amount: updatedTx.amount,
                category: updatedTx.category,
                scope: updatedTx.scope,
                paymentMethod: updatedTx.paymentMethod,
                excludeFromTotals: updatedTx.excludeFromTotals,
              }
            : b
        );
      } else if (updatedTx.id.startsWith('tx_auto_svc_')) {
        const svcId = updatedTx.id.replace('tx_auto_svc_', '');
        updatedServices = updatedServices.map((s) =>
          s.id === svcId
            ? {
                ...s,
                cost: updatedTx.amount,
                title: updatedTx.description.replace('Manutenção: ', ''),
              }
            : s
        );
      } else if (updatedTx.id.startsWith('tx_auto_reading_')) {
        const readingId = updatedTx.id.replace('tx_auto_reading_', '');
        updatedReadings = updatedReadings.map((r) =>
          r.id === readingId ? { ...r, cost: updatedTx.amount } : r
        );
      }

      // Sync auto bill if updating a house or car expense
      const autoBillId = `bill_auto_tx_${updatedTx.id}`;
      if (updatedTx.type === 'despesa' && updatedBills.some((b) => b.id === autoBillId)) {
        updatedBills = updatedBills.map((b) =>
          b.id === autoBillId
            ? {
                ...b,
                title: updatedTx.description,
                amount: updatedTx.amount,
                dueDate: updatedTx.date,
                category: updatedTx.category,
                scope: updatedTx.scope,
                paymentMethod: updatedTx.paymentMethod,
                status: updatedTx.paid ? 'pago' : 'pendente',
                paidDate: updatedTx.paid ? updatedTx.date : undefined,
              }
            : b
        );
      }

      const nextData = {
        ...prev,
        transactions: updatedTransactions,
        bills: updatedBills,
        vehicleServices: updatedServices,
        homeReadings: updatedReadings,
      };
      saveAllAppData(nextData);
      return nextData;
    });
  };

  // Handler: Delete Transaction
  const handleDeleteTransaction = useCallback((id: string) => {
    const tx = data.transactions.find((t) => t.id === id);
    if (tx && (tx.installment || /\b\d+\s*\/\s*\d+\b/.test(tx.description || ''))) {
      const info = tx.installment ? ` (${tx.installment.current}/${tx.installment.total})` : '';
      const txName = tx.description || 'Lançamento';
      const confirmed = window.confirm(`Deseja realmente cancelar/excluir o lançamento parcelado "${txName}"${info}?`);
      if (!confirmed) return;
    }
    setData((prev) => {
      const updatedTransactions = (prev.transactions || []).filter((t) => t.id !== id);
      let updatedBills = (prev.bills || []).filter((b) => b.id !== `bill_auto_tx_${id}`);

      // If deleting an auto bill transaction, revert bill status to pendente
      if (id.startsWith('tx_auto_bill_')) {
        const billId = id.replace('tx_auto_bill_', '');
        updatedBills = updatedBills.map((b) =>
          b.id === billId ? { ...b, status: 'pendente' as const, paidDate: undefined } : b
        );
      }

      const nextData = {
        ...prev,
        transactions: updatedTransactions,
        bills: updatedBills,
      };
      saveAllAppData(nextData);
      return nextData;
    });
  }, [data.transactions]);

  // Handler: Delete All House Transactions
  const handleDeleteAllHouseTransactions = () => {
    setData((prev) => ({
      ...prev,
      transactions: (prev.transactions || []).filter((t) => t.scope !== 'casa'),
    }));
  };

  // Handler: Add or Edit Bill (Single or Batch)
  const handleSaveBill = (
    billData: (Omit<Bill, 'id' | 'status'> & { id?: string; paid?: boolean }) | (Omit<Bill, 'id' | 'status'> & { id?: string; paid?: boolean })[],
    existingId?: string
  ) => {
    const today = getTodayStr();
    const items = Array.isArray(billData) ? billData : [billData];

    setData((prev) => {
      let currentBills = [...(prev.bills || [])];
      let currentTransactions = [...(prev.transactions || [])];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const { paid, ...restBillData } = item;
        const targetId = item.id || (items.length === 1 ? existingId : undefined);

        if (targetId) {
          const billIndex = currentBills.findIndex((b) => b.id === targetId);
          if (billIndex >= 0) {
            const prevBill = currentBills[billIndex];
            const isNowPaid = paid !== undefined ? paid : (prevBill.status === 'pago');
            currentBills[billIndex] = {
              ...prevBill,
              ...restBillData,
              id: targetId,
              status: isNowPaid ? 'pago' : 'pendente',
              paidDate: isNowPaid ? (prevBill.paidDate || restBillData.dueDate || today) : undefined,
            };

            const autoTxId = `tx_auto_bill_${targetId}`;
            const txIndex = currentTransactions.findIndex((t) => t.id === autoTxId);

            if (txIndex >= 0) {
              if (isNowPaid) {
                const targetScope = getValidScope(restBillData.scope, restBillData.category, restBillData.title);
                currentTransactions[txIndex] = {
                  ...currentTransactions[txIndex],
                  description: restBillData.title,
                  amount: restBillData.amount,
                  category: restBillData.category,
                  scope: targetScope,
                  paymentMethod: restBillData.paymentMethod,
                  excludeFromTotals: restBillData.excludeFromTotals,
                };
              } else {
                currentTransactions.splice(txIndex, 1);
              }
            } else if (isNowPaid) {
              const targetScope = getValidScope(restBillData.scope, restBillData.category, restBillData.title);
              currentTransactions.push({
                id: autoTxId,
                description: restBillData.title,
                amount: restBillData.amount,
                type: 'despesa',
                category: restBillData.category,
                scope: targetScope,
                date: restBillData.dueDate || today,
                paymentMethod: restBillData.paymentMethod,
                paid: true,
                excludeFromTotals: restBillData.excludeFromTotals,
              });
            }
            continue;
          }
        }

        // Check if bill with same title and dueDate already exists to prevent duplicates
        const exists = currentBills.some(
          (b) => b.title.trim().toLowerCase() === restBillData.title.trim().toLowerCase() && b.dueDate === restBillData.dueDate
        );

        if (!exists) {
          const newId = `bill_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`;
          const newBill: Bill = {
            ...restBillData,
            id: newId,
            status: paid ? 'pago' : 'pendente',
            paidDate: paid ? (restBillData.dueDate || today) : undefined,
          };
          currentBills.push(newBill);

          if (paid) {
            const autoTxId = `tx_auto_bill_${newId}`;
            const targetScope = getValidScope(restBillData.scope, restBillData.category, restBillData.title);
            currentTransactions.push({
              id: autoTxId,
              description: restBillData.title,
              amount: restBillData.amount,
              type: 'despesa',
              category: restBillData.category,
              scope: targetScope,
              date: restBillData.dueDate || today,
              paymentMethod: restBillData.paymentMethod,
              paid: true,
              excludeFromTotals: restBillData.excludeFromTotals,
            });
          }
        }
      }

      const nextData = {
        ...prev,
        bills: currentBills,
        transactions: currentTransactions,
      };

      saveAllAppData(nextData);
      return nextData;
    });
  };

  // Handler: Direct Update Bill
  const handleUpdateBill = (updatedBill: Bill) => {
    setData((prev) => {
      const updatedBills = (prev.bills || []).map((b) => (b.id === updatedBill.id ? updatedBill : b));
      let updatedTransactions = [...(prev.transactions || [])];
      
      const autoTxId = `tx_auto_bill_${updatedBill.id}`;
      const txIndex = updatedTransactions.findIndex((t) => t.id === autoTxId);
      
      if (txIndex >= 0) {
        if (updatedBill.status === 'pago') {
          const targetScope = getValidScope(updatedBill.scope, updatedBill.category, updatedBill.title);
          updatedTransactions[txIndex] = {
            ...updatedTransactions[txIndex],
            description: updatedBill.title,
            amount: updatedBill.amount,
            category: updatedBill.category,
            scope: targetScope,
            paymentMethod: updatedBill.paymentMethod,
            excludeFromTotals: updatedBill.excludeFromTotals,
          };
        } else {
          updatedTransactions.splice(txIndex, 1);
        }
      }
      
      const nextData = {
        ...prev,
        bills: updatedBills,
        transactions: updatedTransactions,
      };
      saveAllAppData(nextData);
      return nextData;
    });
  };

  // Handler: Pay/Undo Bill
  const handlePayBill = useCallback((billId: string) => {
    const today = getTodayStr();
    setData((prev) => {
      let isNowPaid = false;
      const updatedBills = (prev.bills || []).map((b) => {
        if (b.id === billId) {
          isNowPaid = b.status !== 'pago';
          return {
            ...b,
            status: isNowPaid ? ('pago' as const) : ('pendente' as const),
            paidDate: isNowPaid ? today : undefined,
          };
        }
        return b;
      });

      let updatedTransactions = [...(prev.transactions || [])];
      const autoTxId = `tx_auto_bill_${billId}`;
      const txIndex = updatedTransactions.findIndex((t) => t.id === autoTxId);
      const bill = updatedBills.find((b) => b.id === billId);

      if (bill) {
        if (isNowPaid && txIndex < 0) {
          const targetScope = getValidScope(bill.scope, bill.category, bill.title);
          updatedTransactions.push({
            id: autoTxId,
            description: bill.title,
            amount: bill.amount,
            type: 'despesa',
            category: bill.category,
            scope: targetScope,
            date: today,
            paymentMethod: bill.paymentMethod,
            paid: true,
            excludeFromTotals: bill.excludeFromTotals,
          });
        } else if (!isNowPaid && txIndex >= 0) {
          updatedTransactions.splice(txIndex, 1);
        }
      }

      const nextData = {
        ...prev,
        bills: updatedBills,
        transactions: updatedTransactions,
      };
      saveAllAppData(nextData);
      return nextData;
    });
  }, []);

  // Handler: Delete Bill
  const handleDeleteBill = useCallback((billId: string) => {
    setData((prev) => {
      const nextData = {
        ...prev,
        bills: (prev.bills || []).filter((b) => b.id !== billId),
        transactions: (prev.transactions || []).filter((t) => t.id !== `tx_auto_bill_${billId}`),
      };
      saveAllAppData(nextData);
      return nextData;
    });
  }, []);

  // Handler: Delete Multiple Bills
  const handleDeleteMultipleBills = useCallback((billIds: string[]) => {
    const idSet = new Set(billIds);
    setData((prev) => {
      const nextData = {
        ...prev,
        bills: (prev.bills || []).filter((b) => !idSet.has(b.id)),
        transactions: (prev.transactions || []).filter((t) => {
          if (t.id.startsWith('tx_auto_bill_')) {
            const billId = t.id.replace('tx_auto_bill_', '');
            return !idSet.has(billId);
          }
          return true;
        }),
      };
      saveAllAppData(nextData);
      return nextData;
    });
  }, []);

  // Handler: Delete All Bills
  const handleDeleteAllBills = () => {
    setData((prev) => ({
      ...prev,
      bills: [],
      transactions: (prev.transactions || []).filter(
        (t) =>
          t.scope !== 'pagamentos' &&
          !t.id.startsWith('tx_auto_bill_') &&
          !t.id.startsWith('bill_auto_tx_')
      ),
    }));
  };

  const handleImportMasterBills = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const masterList = [
      { title: 'Caixa', day: 1, amount: 3965.08, scope: 'casa' as const, category: 'Financiamento' as const },
      { title: 'Digio', day: 1, amount: 0, scope: 'casa' as const, category: 'Fatura de Cartão' as const },
      { title: 'Inter', day: 2, amount: 0, scope: 'casa' as const, category: 'Fatura de Cartão' as const },
      { title: 'Condominio', day: 10, amount: 401.93, scope: 'casa' as const, category: 'Condomínio' as const },
      { title: 'Financiamento Apto', day: 12, amount: 1000, scope: 'casa' as const, category: 'Moradia' as const },
      { title: 'Santander', day: 14, amount: 0, scope: 'casa' as const, category: 'Fatura de Cartão' as const },
      { title: 'Mercado Pago', day: 14, amount: 0, scope: 'casa' as const, category: 'Fatura de Cartão' as const },
      { title: 'Internet', day: 15, amount: 65.88, scope: 'casa' as const, category: 'Internet/TV' as const },
      { title: 'Nubank Empresa', day: 16, amount: 0, scope: 'empresa' as const, category: 'Empresa' as const },
      { title: 'MEI', day: 20, amount: 87.05, scope: 'empresa' as const, category: 'Empresa' as const },
      { title: 'Nubank', day: 25, amount: 2853.89, scope: 'casa' as const, category: 'Fatura de Cartão' as const },
      { title: 'Luz', day: 28, amount: 0, scope: 'casa' as const, category: 'Energia' as const },
    ];

    const targetTitles = new Set(masterList.map(m => m.title));
    const prefix = `${year}-${month}`;

    setData(prev => {
      // Remove existing bills with the same titles in the same month to allow clean update
      const filteredBills = prev.bills.filter(b => !(b.dueDate.startsWith(prefix) && targetTitles.has(b.title)));
      
      const newBills = masterList.map((item, idx) => {
        const dayStr = String(item.day).padStart(2, '0');
        return {
          id: `bill_master_${Date.now()}_${idx}`,
          title: item.title,
          amount: item.amount,
          dueDate: `${prefix}-${dayStr}`,
          status: 'pendente' as const,
          category: item.category,
          scope: item.scope,
          paymentMethod: 'PIX' as const,
          recurring: 'mensal' as const,
        };
      });

      return {
        ...prev,
        bills: [...filteredBills, ...newBills]
      };
    });

    alert('Lista Mestra de contas atualizada com sucesso para este mês!');
  }, []);

  // Handler: Delete Duplicate Bills
  const handleDeleteDuplicateBills = () => {
    setData((prev) => {
      const groups = new Map<string, Bill[]>();

      for (const bill of prev.bills) {
        const titleKey = bill.title.toLowerCase().trim().replace(/\s+/g, ' ');
        const scopeKey = (bill.scope || 'casa').toLowerCase();
        const monthKey = bill.dueDate ? bill.dueDate.substring(0, 7) : '';
        const key = `${scopeKey}___${monthKey}___${titleKey}`;
        
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(bill);
      }

      const uniqueBills: Bill[] = [];
      const keptBillIds = new Set<string>();

      groups.forEach((billList) => {
        if (billList.length === 1) {
          uniqueBills.push(billList[0]);
          keptBillIds.add(billList[0].id);
        } else {
          // Sort duplicates to keep the best/most complete record
          const sorted = [...billList].sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;
            if (a.status === 'pago') scoreA += 100;
            if (b.status === 'pago') scoreB += 100;
            if (a.barcode) scoreA += 20;
            if (b.barcode) scoreB += 20;
            if (a.pixCode) scoreA += 20;
            if (b.pixCode) scoreB += 20;
            if (a.notes) scoreA += 10;
            if (b.notes) scoreB += 10;
            if (!a.id.startsWith('bill_auto_')) scoreA += 10;
            if (!b.id.startsWith('bill_auto_')) scoreB += 10;
            return scoreB - scoreA;
          });

          const chosen = sorted[0];
          uniqueBills.push(chosen);
          keptBillIds.add(chosen.id);
        }
      });

      const removedCount = prev.bills.length - uniqueBills.length;

      // Clean up transactions associated with removed bills
      const updatedTransactions = prev.transactions.filter((t) => {
        if (t.id.startsWith('tx_auto_bill_')) {
          const billId = t.id.replace('tx_auto_bill_', '');
          return keptBillIds.has(billId);
        }
        return true;
      });

      if (removedCount > 0) {
        alert(`Foram removidas ${removedCount} conta(s) duplicada(s) com sucesso! Seus dados estão agora limpos e organizados.`);
      } else {
        alert('Nenhuma conta duplicada encontrada.');
      }
      return {
        ...prev,
        bills: uniqueBills,
        transactions: updatedTransactions,
      };
    });
  };

  // Handler: Update Vehicle Odometer
  const handleUpdateKm = useCallback((vehicleId: string, newKm: number) => {
    setData((prev) => ({
      ...prev,
      vehicles: (prev.vehicles || []).map((v) => (v.id === vehicleId ? { ...v, currentKm: newKm } : v)),
    }));
  }, []);

  // Handler: Add Home Utility Reading
  const handleAddHomeReading = (newReading: Omit<HomeUtilityReading, 'id'>) => {
    const reading: HomeUtilityReading = {
      ...newReading,
      id: `reading_${Date.now()}`,
    };
    setData((prev) => {
      let newTransactions = [...(prev.transactions || [])];
      let newBills = [...(prev.bills || [])];

      if (reading.cost && reading.cost > 0) {
        const categoryMap: Record<string, TransactionCategory> = {
          Energia: 'Energia',
          Condomínio: 'Condomínio',
          Internet: 'Internet/TV',
          Financiamento: 'Financiamento',
        };
        const dateStr = `${reading.month}-${String(reading.dueDay || 10).padStart(2, '0')}`;
        const cat = categoryMap[reading.type] || 'Outros';

        const autoTx: Transaction = {
          id: `tx_auto_reading_${reading.id}`,
          description: `Leitura Casa: ${reading.type} (${reading.month})`,
          amount: reading.cost,
          type: 'despesa',
          category: cat,
          scope: 'casa',
          date: dateStr,
          paymentMethod: 'PIX',
          paid: true,
          notes: `Consumo: ${reading.consumption || 0}`,
        };
        newTransactions = [autoTx, ...newTransactions];

        const autoBill: Bill = {
          id: `bill_auto_reading_${reading.id}`,
          title: `Casa: ${reading.type} (${reading.month})`,
          amount: reading.cost,
          dueDate: dateStr,
          category: cat,
          scope: 'casa',
          paymentMethod: 'PIX',
          status: 'pago',
          paidDate: dateStr,
          recurring: 'mensal',
        };
        newBills = [autoBill, ...newBills];
      }

      return {
        ...prev,
        homeReadings: [...(prev.homeReadings || []), reading],
        transactions: newTransactions,
        bills: newBills,
      };
    });
  };

  // Handler: Direct Update Home Reading
  const handleUpdateHomeReading = (updatedReading: HomeUtilityReading) => {
    setData((prev) => {
      let newTransactions = [...(prev.transactions || [])];
      let newBills = [...(prev.bills || [])];
      const autoTxId = `tx_auto_reading_${updatedReading.id}`;
      const autoBillId = `bill_auto_reading_${updatedReading.id}`;

      if (updatedReading.cost && updatedReading.cost > 0) {
        const categoryMap: Record<string, TransactionCategory> = {
          Energia: 'Energia',
          Condomínio: 'Condomínio',
          Internet: 'Internet/TV',
          Financiamento: 'Financiamento',
        };
        const dateStr = `${updatedReading.month}-${String(updatedReading.dueDay || 10).padStart(2, '0')}`;
        const cat = categoryMap[updatedReading.type] || 'Outros';

        const autoTx: Transaction = {
          id: autoTxId,
          description: `Leitura Casa: ${updatedReading.type} (${updatedReading.month})`,
          amount: updatedReading.cost,
          type: 'despesa',
          category: cat,
          scope: 'casa',
          date: dateStr,
          paymentMethod: 'PIX',
          paid: true,
          notes: `Consumo: ${updatedReading.consumption || 0}`,
        };
        if (newTransactions.some((t) => t.id === autoTxId)) {
          newTransactions = newTransactions.map((t) => (t.id === autoTxId ? autoTx : t));
        } else {
          newTransactions = [autoTx, ...newTransactions];
        }

        const autoBill: Bill = {
          id: autoBillId,
          title: `Casa: ${updatedReading.type} (${updatedReading.month})`,
          amount: updatedReading.cost,
          dueDate: dateStr,
          category: cat,
          scope: 'casa',
          paymentMethod: 'PIX',
          status: 'pago',
          paidDate: dateStr,
          recurring: 'mensal',
        };
        if (newBills.some((b) => b.id === autoBillId)) {
          newBills = newBills.map((b) => (b.id === autoBillId ? autoBill : b));
        } else {
          newBills = [autoBill, ...newBills];
        }
      } else {
        newTransactions = newTransactions.filter((t) => t.id !== autoTxId);
        newBills = newBills.filter((b) => b.id !== autoBillId);
      }

      return {
        ...prev,
        homeReadings: (prev.homeReadings || []).map((r) => (r.id === updatedReading.id ? updatedReading : r)),
        transactions: newTransactions,
        bills: newBills,
      };
    });
  };

  // Handler: Delete Home Reading
  const handleDeleteHomeReading = (id: string) => {
    setData((prev) => ({
      ...prev,
      homeReadings: (prev.homeReadings || []).filter((r) => r.id !== id),
      transactions: (prev.transactions || []).filter((t) => t.id !== `tx_auto_reading_${id}`),
      bills: (prev.bills || []).filter((b) => b.id !== `bill_auto_reading_${id}`),
    }));
  };

  // Handler: Add Home Task
  const handleAddHomeTask = (newTask: Omit<HomeTask, 'id' | 'completed'>) => {
    const task: HomeTask = {
      ...newTask,
      id: `task_${Date.now()}`,
      completed: false,
    };
    setData((prev) => ({
      ...prev,
      homeTasks: [...(prev.homeTasks || []), task],
    }));
  };

  // Handler: Direct Update Home Task
  const handleUpdateHomeTask = (updatedTask: HomeTask) => {
    setData((prev) => ({
      ...prev,
      homeTasks: (prev.homeTasks || []).map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    }));
  };

  // Handler: Delete Home Task
  const handleDeleteHomeTask = (id: string) => {
    setData((prev) => ({
      ...prev,
      homeTasks: (prev.homeTasks || []).filter((t) => t.id !== id),
    }));
  };

  // Handler: Toggle Home Task Completion
  const handleToggleHomeTask = (taskId: string) => {
    setData((prev) => ({
      ...prev,
      homeTasks: (prev.homeTasks || []).map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  };

  // Handler: Clear All House Data (Readings, Tasks, House Bills and Transactions)
  const handleClearAllHouseData = () => {
    setData((prev) => {
      const readingIds = new Set((prev.homeReadings || []).map((r) => r.id));
      const remainingBills = (prev.bills || []).filter((b) => {
        if (b.scope === 'casa') return false;
        if (b.id.startsWith('bill_auto_reading_')) {
          const rId = b.id.replace('bill_auto_reading_', '');
          if (readingIds.has(rId)) return false;
        }
        return true;
      });
      const remainingTransactions = (prev.transactions || []).filter((t) => {
        if (t.scope === 'casa') return false;
        if (t.id.startsWith('tx_auto_reading_')) return false;
        if (t.id.startsWith('tx_auto_bill_')) {
          const bId = t.id.replace('tx_auto_bill_', '');
          if (!remainingBills.some((b) => b.id === bId)) return false;
        }
        return true;
      });

      return {
        ...prev,
        homeReadings: [],
        homeTasks: [],
        bills: remainingBills,
        transactions: remainingTransactions,
      };
    });
  };

  const handleClearAllExpensesAndRecords = () => {
    setData((prev) => ({
      ...prev,
      transactions: [],
      bills: [],
      homeReadings: [],
    }));
  };

  const handleClearAllDailyLogs = () => {
    setData((prev) => ({
      ...prev,
      dailyLogs: [],
    }));
  };

  const handleDeleteAllBudgets = () => {
    setData((prev) => ({
      ...prev,
      budgets: [],
    }));
  };

  const handleClearAllTransactions = () => {
    setData((prev) => ({
      ...prev,
      transactions: [],
    }));
  };

  // Handler: Delete All Daily Logs and Data
  const handleClearAllDataExceptFixed = () => {
    setData((prev) => ({
      ...prev,
      dailyLogs: [],
      transactions: prev.transactions.filter((t) => t.category === 'Fixas'),
      vehicleServices: [],
      homeReadings: [],
      homeTasks: [],
    }));
  };

  // Export App Data (Open Full Backup & Export Center)
  const handleExportData = () => {
    setIsBackupModalOpen(true);
  };

  // Export Excel Spreadsheet (All Tabs & Collections)
  const handleExportExcel = () => {
    try {
      exportAppToExcel(data);
    } catch (err: any) {
      alert(`Erro ao exportar Excel: ${err?.message || 'Falha inesperada'}`);
    }
  };

  // Import App Data (Full Restore)
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    saveAutomaticRestorePoint(data, 'Antes da Restauração');

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreFullBackupFromJSON(content);
      if (res.success && res.restoredData) {
        setData(res.restoredData);
        alert(`Backup restaurado com sucesso! Foram recuperados ${res.restoredSummary?.total || 0} registros.`);
      } else {
        alert(res.error || 'Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Open Reset Modal
  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  // Confirm Reset with selected categories
  const handleConfirmReset = (selection: ResetCategorySelection, mode: 'clear' | 'demo') => {
    resetSelectedCategories(selection, mode);
    setData(loadAllAppData());
  };

  // Handler: Sync Monthly Recurring Bills
  const handleSyncMonthlyBills = useCallback((targetMonthStr?: string) => {
    const today = getTodayStr();
    const currentMonth = targetMonthStr || today.slice(0, 7);
    let updatedOrAddedCount = 0;

    setData((prev) => {
      const existingBills = [...prev.bills];
      const recurringMonthlyMap = new Map<string, Bill[]>();

      for (const b of existingBills) {
        // Only process bills marked as monthly and not installments like (1/12)
        const isInstallment = /\(\d+\/\d+\)/.test(b.title);
        if (b.recurring === 'mensal' && !isInstallment) {
          const scope = (b.scope || 'casa').toLowerCase();
          const cleanTitle = b.title.trim().toLowerCase().replace(/\s+/g, ' ');
          const key = `${scope}___${cleanTitle}`;
          if (!recurringMonthlyMap.has(key)) {
            recurringMonthlyMap.set(key, []);
          }
          recurringMonthlyMap.get(key)!.push(b);
        }
      }

      let hasChanges = false;
      const updatedBills = [...existingBills];

      recurringMonthlyMap.forEach((billsList, groupKey) => {
        const [groupScope, ...titleParts] = groupKey.split('___');
        const cleanTitle = titleParts.join('___');

        const sorted = [...billsList].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
        const previousBill = sorted.find((b) => !b.dueDate.startsWith(currentMonth)) || sorted[0];

        // Check if ANY bill already exists in current month for this title and scope
        const currentBillIndex = updatedBills.findIndex((b) => {
          const bScope = (b.scope || 'casa').toLowerCase();
          const bTitle = b.title.trim().toLowerCase().replace(/\s+/g, ' ');
          return bScope === groupScope && bTitle === cleanTitle && (b.dueDate || '').startsWith(currentMonth);
        });

        if (currentBillIndex >= 0) {
          const currentBill = updatedBills[currentBillIndex];
          // If it's a fixed bill (NOT credit card / energy) and amount differs from last month, update it to match
          if (!isVariableBill(currentBill.title, currentBill.category) && previousBill && previousBill.id !== currentBill.id) {
            if (currentBill.amount !== previousBill.amount) {
              updatedBills[currentBillIndex] = {
                ...currentBill,
                amount: previousBill.amount,
              };
              hasChanges = true;
              updatedOrAddedCount++;
            }
          }
        } else if (previousBill) {
          // Bill does not exist for current month: create it with previous month's amount
          const day = parseInt(previousBill.dueDate.split('-')[2] || '1', 10);
          const [year, month] = currentMonth.split('-').map(Number);
          const maxDays = new Date(year, month, 0).getDate();
          const targetDay = Math.min(day, maxDays);
          const newDueDate = `${currentMonth}-${String(targetDay).padStart(2, '0')}`;

          const newBill: Bill = {
            id: `bill_auto_m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title: previousBill.title,
            amount: previousBill.amount,
            dueDate: newDueDate,
            category: previousBill.category,
            scope: previousBill.scope,
            paymentMethod: previousBill.paymentMethod,
            status: 'pendente',
            recurring: 'mensal',
            excludeFromTotals: previousBill.excludeFromTotals,
            barcode: previousBill.barcode,
            pixCode: previousBill.pixCode,
            recipient: previousBill.recipient,
            notes: previousBill.notes,
          };

          updatedBills.push(newBill);
          hasChanges = true;
          updatedOrAddedCount++;
        }
      });

      // Deduplicate pass across updatedBills to eliminate any existing duplicates for this month
      const dedupMap = new Map<string, Bill>();
      const finalBills: Bill[] = [];
      for (const bill of updatedBills) {
        const month = (bill.dueDate || '').slice(0, 7);
        const titleKey = bill.title.toLowerCase().trim().replace(/\s+/g, ' ');
        const scopeKey = (bill.scope || 'casa').toLowerCase();
        const dKey = `${scopeKey}___${month}___${titleKey}`;

        if (!dedupMap.has(dKey)) {
          dedupMap.set(dKey, bill);
          finalBills.push(bill);
        } else {
          // Duplicate detected - keep the paid one or the one with barcode/details
          const existing = dedupMap.get(dKey)!;
          if (existing.status !== 'pago' && bill.status === 'pago') {
            const idx = finalBills.indexOf(existing);
            if (idx >= 0) finalBills[idx] = bill;
            dedupMap.set(dKey, bill);
            hasChanges = true;
          } else {
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        return {
          ...prev,
          bills: finalBills,
        };
      }
      return prev;
    });

    return updatedOrAddedCount;
  }, []);

  // Handler: Update Budget
  const handleUpdateBudget = (category: TransactionCategory, allocated: number) => {
    setData((prev) => {
      const exists = prev.budgets.some((b) => b.category === category);
      if (exists) {
        return {
          ...prev,
          budgets: prev.budgets.map((b) => (b.category === category ? { ...b, allocated } : b)),
        };
      }
      return {
        ...prev,
        budgets: [...prev.budgets, { category, allocated }],
      };
    });
  };

  // Quick Open Transaction with scope, category & type context
  const handleOpenNewTransactionAdvanced = (
    scope: CategoryScope = 'geral',
    category: TransactionCategory = 'Outros',
    type: TransactionType = 'despesa'
  ) => {
    setEditingTransaction(null);
    setDefaultScopeForTransaction(scope);
    setDefaultCategoryForTransaction(category);
    setDefaultTypeForTransaction(type);
    setIsTransactionModalOpen(true);
  };

  const [defaultScopeForBill, setDefaultScopeForBill] = useState<CategoryScope>('casa');

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  };

  const handleOpenNewBill = (scope: CategoryScope = 'casa') => {
    setEditingBill(null);
    setDefaultScopeForBill(scope);
    setIsBillModalOpen(true);
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setIsBillModalOpen(true);
  };

  const todayStr = getTodayStr();
  const currentMonthStr = todayStr.slice(0, 7);
  
  const processedBills = useMemo(() => data.bills.map((b) => {
    const effectiveDueDate = getEffectiveDueDate(b.dueDate);
    if (b.status === 'pendente' && effectiveDueDate < todayStr) {
      return { ...b, status: 'atrasado' as const };
    }
    return b;
  }), [data.bills, todayStr]);

  const pendingBillsCount = useMemo(() => processedBills.filter((b) => 
    (b.status === 'pendente' || b.status === 'atrasado') && 
    b.paymentMethod !== 'SEM PAGAMENTO' &&
    b.dueDate.slice(0, 7) <= currentMonthStr
  ).length, [processedBills, currentMonthStr]);

  const processedTransactions = useMemo(() => data.transactions.map(t => {
    if (t.installment) {
      return {
        ...t,
        installment: {
          ...t.installment,
          current: t.installment.current || calculateCurrentInstallment(t.date, t.installment.total)
        }
      };
    }
    return t;
  }), [data.transactions]);

  // Monthly fixed cost estimate for calculators
  const monthlyFixedCost = processedBills
    .filter((b) => b.dueDate.startsWith(currentMonthStr))
    .reduce((acc, b) => acc + b.amount, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenNewBill={handleOpenNewBill}
        onOpenCalculators={() => setIsCalculatorsModalOpen(true)}
        onOpenCreditCards={() => setIsCreditCardsModalOpen(true)}
        onOpenNewTransaction={(scope, cat, type) =>
          handleOpenNewTransactionAdvanced(scope || 'geral', cat || 'Outros', type || 'despesa')
        }
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenModuleCustomizer={() => setIsModuleCustomizerOpen(true)}
        onOpenNotificationsAuth={() => setIsNotificationsAuthOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onExportData={handleExportData}
        onExportExcel={handleExportExcel}
        onImportData={handleImportData}
        onResetData={handleResetData}
        pendingBillsCount={pendingBillsCount}
        enabledModules={data.enabledModules || ['contas', 'entradas', 'resumo', 'relatorios']}
        setEnabledModules={setEnabledModules}
        onConsolidateData={handleConsolidateData}
      />

      {/* Main Container - Visão Geral com Módulos Internos */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 sm:pb-12">
        {(activeTab === 'resumo' || activeTab === 'dashboard') && (
          <Dashboard
            transactions={processedTransactions}
            bills={processedBills}
            homeTasks={data.homeTasks}
            creditCards={data.creditCards}
            onPayBill={handlePayBill}
            onOpenNewTransaction={(scope, cat, type) =>
              handleOpenNewTransactionAdvanced(scope || 'geral', cat || 'Outros', type || 'despesa')
            }
            onOpenNewBill={handleOpenNewBill}
            onOpenCalculators={() => setIsCalculatorsModalOpen(true)}
            onOpenCreditCardsManage={() => setIsCreditCardsModalOpen(true)}
            setActiveTab={handleSelectTab}
            onEditTransaction={handleEditTransaction}
            onEditBill={handleEditBill}
            onUpdateHomeTask={handleUpdateHomeTask}
            onConsolidateData={handleConsolidateData}
          />
        )}

        {activeTab === 'entradas' && (
          <IncomesModule
            transactions={processedTransactions}
            vehicles={data.vehicles}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
            onOpenNewIncome={(scope = 'empresa', category = 'Salário/Renda', source) => {
              setEditingTransaction(null);
              setDefaultScopeForTransaction(scope);
              setDefaultCategoryForTransaction(category);
              setDefaultTypeForTransaction('receita');
              setDefaultDescriptionForTransaction(source || '');
              setIsTransactionModalOpen(true);
            }}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onSaveDirectTransaction={(tx) => handleSaveTransaction(tx)}
          />
        )}

        {activeTab === 'contas' && (
          <BillsModule
            bills={processedBills}
            transactions={processedTransactions}
            onPayBill={handlePayBill}
            onDeleteBill={handleDeleteBill}
            onOpenNewBillModal={handleOpenNewBill}
            onEditBill={handleEditBill}
            onUpdateBill={handleUpdateBill}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteDuplicateBills={handleDeleteDuplicateBills}
            onImportMasterBills={handleImportMasterBills}
            onSyncMonthlyBills={handleSyncMonthlyBills}
            onCopyBills={(newBills) => {
              setData((prev) => ({
                ...prev,
                bills: [...prev.bills, ...newBills],
              }));
            }}
          />
        )}

        {activeTab === 'relatorios' && (
          <AnalyticsModule
            transactions={processedTransactions}
            budgets={data.budgets}
            onUpdateBudget={handleUpdateBudget}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
          />
        )}
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(null);
          setDefaultDescriptionForTransaction('');
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        defaultScope={defaultScopeForTransaction}
        defaultCategory={defaultCategoryForTransaction}
        defaultType={defaultTypeForTransaction}
        defaultDescription={defaultDescriptionForTransaction}
        editingTransaction={editingTransaction}
      />

      <BillModal
        isOpen={isBillModalOpen}
        onClose={() => {
          setIsBillModalOpen(false);
          setEditingBill(null);
        }}
        onSave={handleSaveBill}
        onDelete={handleDeleteBill}
        onDeleteMultiple={handleDeleteMultipleBills}
        editingBill={editingBill}
        defaultScope={defaultScopeForBill}
        existingBills={data.bills}
      />

      <CalculatorsModal
        isOpen={isCalculatorsModalOpen}
        onClose={() => setIsCalculatorsModalOpen(false)}
        monthlyFixedExpenses={monthlyFixedCost}
      />

      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onSaveTransaction={handleSaveTransaction}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onResetData={handleResetData}
        onExportExcel={handleExportExcel}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      <ResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
      />

      <CreditCardsModal
        isOpen={isCreditCardsModalOpen}
        onClose={() => setIsCreditCardsModalOpen(false)}
        creditCards={data.creditCards || []}
        onSave={(cards) => setData({ ...data, creditCards: cards })}
      />

      {/* Due Bills Startup Alert Popup Modal */}
      <DueBillsAlertModal
        bills={processedBills}
        transactions={processedTransactions}
        onPayBill={handlePayBill}
        onUpdateTransaction={handleUpdateTransaction}
      />

      <ModuleCustomizerModal
        isOpen={isModuleCustomizerOpen}
        onClose={() => setIsModuleCustomizerOpen(false)}
        enabledModules={data.enabledModules || ['contas', 'entradas', 'resumo', 'relatorios']}
        setEnabledModules={setEnabledModules}
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
      />

      <NotificationsAndAuthorizationsModal
        isOpen={isNotificationsAuthOpen}
        onClose={() => setIsNotificationsAuthOpen(false)}
      />

      {/* Central de Backup e Restauração Completa */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        appData={data}
        onDataRestored={(newData) => setData(newData)}
      />

      {/* Native Mobile Bottom Navigation Bar */}
      <div className="sm:hidden">
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          pendingBillsCount={pendingBillsCount}
          onOpenNewBill={handleOpenNewBill}
          onOpenNewTransaction={(scope, cat, type) =>
            handleOpenNewTransactionAdvanced(scope || 'geral', cat || 'Outros', type || 'despesa')
          }
          onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
          onOpenCalculators={() => setIsCalculatorsModalOpen(true)}
          onOpenCreditCards={() => setIsCreditCardsModalOpen(true)}
          onOpenBackupModal={() => setIsBackupModalOpen(true)}
        />
      </div>
    </div>
  );
}
