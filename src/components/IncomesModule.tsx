import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Car,
  Briefcase,
  Calendar,
  Search,
  Filter,
  Pencil,
  Trash2,
  DollarSign,
  Wallet,
  Sparkles,
  ArrowUpRight,
  Receipt,
  CheckCircle2,
  Plus,
  X,
} from 'lucide-react';
import { Transaction, CategoryScope, TransactionCategory, PaymentMethod, Vehicle } from '../types';
import { formatBRL, formatDateBR, getTodayStr } from '../lib/storage';

interface IncomesModuleProps {
  transactions: Transaction[];
  vehicles?: Vehicle[];
  onOpenNewIncome: (scope?: CategoryScope, category?: TransactionCategory, source?: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onSaveDirectTransaction?: (transaction: Omit<Transaction, 'id'>) => void;
  onAddVehicle?: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle?: (vehicle: Vehicle) => void;
  onDeleteVehicle?: (id: string) => void;
}

export const IncomesModule: React.FC<IncomesModuleProps> = ({
  transactions = [],
  vehicles = [],
  onOpenNewIncome,
  onEditTransaction,
  onDeleteTransaction,
  onSaveDirectTransaction,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(() => getTodayStr().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<'all' | 'onix' | '208' | 'd1' | 'salario' | 'outros'>('all');

  // Direct quick income form state
  const [quickSourceId, setQuickSourceId] = useState<string>('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDate, setQuickDate] = useState(getTodayStr());
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<PaymentMethod>('PIX');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');

  // Handle setting initial quick source after vehicles load
  React.useEffect(() => {
    if (vehicles.length > 0 && !quickSourceId) {
      setQuickSourceId(vehicles[0].id);
      setQuickDesc(`Ganhos ${vehicles[0].name}`);
    }
  }, [vehicles, quickSourceId]);

  const handleSelectQuickSource = (id: string) => {
    setQuickSourceId(id);
    if (id === 'novo') {
      setQuickDesc('Nova Entrada');
    } else {
      const v = vehicles.find((car) => car.id === id);
      if (v) {
        setQuickDesc(`Ganhos ${v.name}`);
      }
    }
  };

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleName.trim()) return;
    if (onAddVehicle) {
      onAddVehicle({
        name: newVehicleName.trim(),
        model: newVehicleModel.trim() || newVehicleName.trim(),
        licensePlate: newVehiclePlate.trim() || undefined,
        isCompany: true,
      });
    }
    setNewVehicleName('');
    setNewVehicleModel('');
    setNewVehiclePlate('');
  };

  const handleSaveEditVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle || !editingVehicle.name.trim()) return;
    if (onUpdateVehicle) {
      onUpdateVehicle(editingVehicle);
    }
    setEditingVehicle(null);
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numVal = parseFloat(quickAmount.replace(',', '.'));
    if (isNaN(numVal) || numVal <= 0) {
      alert('Por favor, informe um valor numérico válido maior que R$ 0,00.');
      return;
    }

    let scope: CategoryScope = 'empresa';
    let category: TransactionCategory = 'Salário/Renda';

    if (quickSourceId === 'novo') {
      scope = 'geral';
      category = 'Outros';
    }

    if (onSaveDirectTransaction) {
      onSaveDirectTransaction({
        description: quickDesc.trim() || 'Entrada',
        amount: numVal,
        type: 'receita',
        category,
        scope,
        date: quickDate || getTodayStr(),
        paymentMethod: quickPaymentMethod,
        paid: true,
      });

      setQuickAmount('');
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3500);
    }
  };

  // Filter only income transactions (type === 'receita')
  const allIncomes = useMemo(() => {
    return transactions.filter((t) => t.type === 'receita');
  }, [transactions]);

  // Month filtered incomes
  const monthIncomes = useMemo(() => {
    return allIncomes.filter((t) => t.date.startsWith(selectedMonth));
  }, [allIncomes, selectedMonth]);

  // Total income for current month
  const monthTotal = useMemo(() => {
    return monthIncomes.reduce((acc, t) => acc + t.amount, 0);
  }, [monthIncomes]);

  // Breakdown by origin for the current month
  const originTotals = useMemo(() => {
    let onix = 0;
    let p208 = 0;
    let d1 = 0;
    let salario = 0;
    let outros = 0;

    monthIncomes.forEach((t) => {
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();

      if (desc.includes('ônix') || desc.includes('onix')) {
        onix += t.amount;
      } else if (desc.includes('208')) {
        p208 += t.amount;
      } else if (desc.includes('d1')) {
        d1 += t.amount;
      } else if (cat.includes('salário') || cat.includes('renda') || desc.includes('salário') || desc.includes('salario')) {
        salario += t.amount;
      } else {
        outros += t.amount;
      }
    });

    return { onix, p208, d1, salario, outros };
  }, [monthIncomes]);

  // Filtered incomes for list view
  const filteredIncomes = useMemo(() => {
    return monthIncomes.filter((t) => {
      const desc = (t.description || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        if (!desc.includes(query) && !cat.includes(query) && !(t.notes || '').toLowerCase().includes(query)) {
          return false;
        }
      }

      // Source filter
      if (selectedSourceFilter === 'onix') {
        return desc.includes('ônix') || desc.includes('onix');
      }
      if (selectedSourceFilter === '208') {
        return desc.includes('208');
      }
      if (selectedSourceFilter === 'd1') {
        return desc.includes('d1');
      }
      if (selectedSourceFilter === 'salario') {
        return cat.includes('salário') || cat.includes('renda') || desc.includes('salário') || desc.includes('salario');
      }
      if (selectedSourceFilter === 'outros') {
        return (
          !desc.includes('ônix') &&
          !desc.includes('onix') &&
          !desc.includes('208') &&
          !desc.includes('d1') &&
          !cat.includes('salário') &&
          !cat.includes('renda')
        );
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [monthIncomes, searchTerm, selectedSourceFilter]);

  // Year total
  const selectedYear = selectedMonth.slice(0, 4);
  const yearTotal = useMemo(() => {
    return allIncomes
      .filter((t) => t.date.startsWith(selectedYear))
      .reduce((acc, t) => acc + t.amount, 0);
  }, [allIncomes, selectedYear]);

  const getSourceBadge = (description: string, category: string) => {
    const desc = (description || '').toLowerCase();
    const cat = (category || '').toLowerCase();

    if (desc.includes('ônix') || desc.includes('onix')) {
      return {
        label: 'Ônix',
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        icon: Car,
      };
    }
    if (desc.includes('208')) {
      return {
        label: 'Peugeot 208',
        bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        icon: Car,
      };
    }
    if (desc.includes('d1')) {
      return {
        label: 'D1',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        icon: Car,
      };
    }
    if (cat.includes('salário') || cat.includes('renda') || desc.includes('salário')) {
      return {
        label: 'Salário / Renda',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        icon: Briefcase,
      };
    }
    return {
      label: 'Outras Receitas',
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      icon: DollarSign,
    };
  };

  return (
    <div className="space-y-6 pb-16">
      {/* HEADER DO MÓDULO */}
      <div className="bg-[#161618] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0 shadow-inner">
              <TrendingUp className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white tracking-tight">Gestão de Entradas & Receitas</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  Editável
                </span>
              </div>
              <p className="text-xs text-white/50 mt-1">
                Lançamento, edição e controle detalhado das suas receitas por veículo e fonte de renda
              </p>
            </div>
          </div>


        </div>

        {/* FORMULÁRIO DE LANÇAMENTO DIRETO E INSTANTÂNEO DE ENTRADA */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Lançamento Direto e Instantâneo:
              </p>
            </div>
            {showSuccessMessage && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Entrada registrada com sucesso!
              </span>
            )}
          </div>

          <form onSubmit={handleQuickSubmit} className="space-y-3">
            {/* Seletor de Origem/Veículo */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(vehicles || []).map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => handleSelectQuickSource(vehicle.id)}
                  onDoubleClick={() => {
                    setEditingVehicle(vehicle);
                    setIsVehicleModalOpen(true);
                  }}
                  title="Duplo clique para editar/excluir este veículo"
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer relative group ${
                    quickSourceId === vehicle.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-slate-900/60 text-white/50 border-white/10 hover:text-white'
                  }`}
                >
                  <Car className={`w-3.5 h-3.5 ${quickSourceId === vehicle.id ? 'text-emerald-400' : 'text-white/40'}`} />
                  <span className="truncate">{vehicle.name}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => handleSelectQuickSource('novo')}
                className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                  quickSourceId === 'novo'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-slate-900/60 text-white/50 border-white/10 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>Entrada Manual</span>
              </button>

            </div>

            {/* Campos do Lançamento */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
              {/* Valor */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 font-bold">R$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white font-bold placeholder-white/20 focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              {/* Descrição */}
              <input
                type="text"
                placeholder="Descrição (ex: Ganhos do dia)"
                value={quickDesc}
                onChange={(e) => setQuickDesc(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-emerald-400"
              />

              {/* Data */}
              <input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900/90 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-400"
              />

              {/* Botão Registrar */}
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Registrar Entrada</span>
              </button>
            </div>

            {quickSourceId === 'novo' && (
              <div className="flex justify-end mt-3 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingVehicle(null);
                    setIsVehicleModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl border border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-300 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Cadastrar Nova Fonte (Carro, App, CLT)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Carro (Fonte Fixa)</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* CARDS RESUMO DE VALORES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Mês */}
        <div className="bg-[#161618] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span className="font-medium">Total de Entradas (Mês)</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatBRL(monthTotal)}
          </div>
          <p className="text-[11px] text-white/40 mt-1">
            {monthIncomes.length} lançamento(s) no mês
          </p>
        </div>

        {/* Total Ônix */}
        <div className="bg-[#161618] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-blue-400" />
              Ônix
            </span>
            <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-mono">
              {monthTotal > 0 ? `${Math.round((originTotals.onix / monthTotal) * 100)}%` : '0%'}
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBRL(originTotals.onix)}
          </div>
          <p className="text-[11px] text-white/40 mt-1">Acumulado em {selectedMonth}</p>
        </div>

        {/* Total 208 */}
        <div className="bg-[#161618] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-indigo-400" />
              Peugeot 208
            </span>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono">
              {monthTotal > 0 ? `${Math.round((originTotals.p208 / monthTotal) * 100)}%` : '0%'}
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBRL(originTotals.p208)}
          </div>
          <p className="text-[11px] text-white/40 mt-1">Acumulado em {selectedMonth}</p>
        </div>

        {/* Total D1 */}
        <div className="bg-[#161618] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-white/50 mb-2">
            <span className="font-medium flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-amber-400" />
              D1
            </span>
            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-mono">
              {monthTotal > 0 ? `${Math.round((originTotals.d1 / monthTotal) * 100)}%` : '0%'}
            </span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatBRL(originTotals.d1)}
          </div>
          <p className="text-[11px] text-white/40 mt-1">Acumulado em {selectedMonth}</p>
        </div>
      </div>

      {/* BARRA DE FILTROS E PESQUISA */}
      <div className="bg-[#161618] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Seletor de Mês */}
          <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs text-white outline-none cursor-pointer font-mono"
            />
          </div>

          {/* Campo de Busca */}
          <div className="flex-1 w-full flex items-center gap-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2">
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input
              type="text"
              placeholder="Buscar entrada por descrição ou observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-white/40 outline-none w-full"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-white/40 hover:text-white text-xs">
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filtro por Origem (Pills) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-white/40 text-[11px] font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Origem:
          </span>

          <button
            onClick={() => setSelectedSourceFilter('all')}
            className={`px-3 py-1 rounded-lg transition shrink-0 ${
              selectedSourceFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            Todas ({monthIncomes.length})
          </button>

          <button
            onClick={() => setSelectedSourceFilter('onix')}
            className={`px-3 py-1 rounded-lg transition shrink-0 ${
              selectedSourceFilter === 'onix'
                ? 'bg-blue-500 text-white font-bold'
                : 'bg-slate-900 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            Ônix
          </button>

          <button
            onClick={() => setSelectedSourceFilter('208')}
            className={`px-3 py-1 rounded-lg transition shrink-0 ${
              selectedSourceFilter === '208'
                ? 'bg-indigo-500 text-white font-bold'
                : 'bg-slate-900 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            Peugeot 208
          </button>

          <button
            onClick={() => setSelectedSourceFilter('d1')}
            className={`px-3 py-1 rounded-lg transition shrink-0 ${
              selectedSourceFilter === 'd1'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            D1
          </button>

          <button
            onClick={() => setSelectedSourceFilter('salario')}
            className={`px-3 py-1 rounded-lg transition shrink-0 ${
              selectedSourceFilter === 'salario'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-900 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            Salário
          </button>

          <button
            onClick={() => setSelectedSourceFilter('outros')}
            className={`px-3 py-1 rounded-lg transition shrink-0 ${
              selectedSourceFilter === 'outros'
                ? 'bg-purple-500 text-white font-bold'
                : 'bg-slate-900 text-white/60 hover:text-white border border-white/5'
            }`}
          >
            Outros
          </button>
        </div>
      </div>

      {/* LISTA DE ENTRADAS CADASTRADAS */}
      <div className="bg-[#161618] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            Lançamentos de Entrada Cadastrados ({filteredIncomes.length})
          </h3>
          <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Soma: {formatBRL(filteredIncomes.reduce((acc, t) => acc + t.amount, 0))}
          </span>
        </div>

        {filteredIncomes.length === 0 ? (
          <div className="text-center py-12 px-4 bg-slate-900/50 rounded-2xl border border-dashed border-white/10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-white">Nenhuma entrada encontrada</h4>
            <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-4">
              Não existem entradas registradas para {selectedMonth} com os filtros selecionados.
            </p>
            <button
              onClick={() => onOpenNewIncome('empresa', 'Salário/Renda')}
              className="px-4 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition inline-flex items-center gap-2 shadow cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Cadastrar Primeira Entrada
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredIncomes.map((income) => {
              const badge = getSourceBadge(income.description, income.category);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={income.id}
                  className="bg-slate-900/90 border border-white/5 hover:border-emerald-500/30 p-4 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-inner">
                      <BadgeIcon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-white">{income.description}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${badge.bg}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-white/40" />
                          {formatDateBR(income.date)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>Forma: <strong className="text-white/70">{income.paymentMethod || 'PIX'}</strong></span>
                        {income.notes && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="italic text-white/40 truncate max-w-[150px]">{income.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-400 flex items-center gap-1 justify-end">
                        <ArrowUpRight className="w-4 h-4" />
                        {formatBRL(income.amount)}
                      </div>
                      <span className="text-[10px] text-emerald-500/80 font-medium uppercase tracking-wider">Receita</span>
                    </div>

                    {/* BOTÕES DE EDÇÃO E EXCLUSÃO */}
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => onEditTransaction(income)}
                        className="p-2 bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-xl border border-white/10 transition cursor-pointer active:scale-95"
                        title="Editar Entrada"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Deseja realmente excluir a entrada "${income.description}" de ${formatBRL(income.amount)}?`)) {
                            onDeleteTransaction(income.id);
                          }
                        }}
                        className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-white/10 transition cursor-pointer active:scale-95"
                        title="Excluir Entrada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE GERENCIAMENTO DE CARROS / VEÍCULOS */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <Car className="w-5 h-5 text-emerald-400" />
                <span>Gerenciar Carros & Veículos</span>
              </div>
              <button
                onClick={() => {
                  setIsVehicleModalOpen(false);
                  setEditingVehicle(null);
                }}
                className="p-2 text-white/60 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* EDIÇÃO DE CARRO */}
            {editingVehicle ? (
              <div className="space-y-4">
                <form onSubmit={handleSaveEditVehicle} className="space-y-3 bg-amber-500/10 p-4 rounded-xl border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                    Editar Carro: {editingVehicle.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(null)}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    Cancelar Edição
                  </button>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-white/70 mb-1 block">Nome do Carro *</label>
                  <input
                    type="text"
                    value={editingVehicle.name}
                    onChange={(e) => setEditingVehicle({ ...editingVehicle, name: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-white/70 mb-1 block">Modelo</label>
                    <input
                      type="text"
                      value={editingVehicle.model || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, model: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/70 mb-1 block">Placa</label>
                    <input
                      type="text"
                      value={editingVehicle.licensePlate || ''}
                      onChange={(e) => setEditingVehicle({ ...editingVehicle, licensePlate: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-400 uppercase"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                  {onDeleteVehicle && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Deseja mesmo excluir o carro ${editingVehicle.name}?`)) {
                          onDeleteVehicle(editingVehicle.id);
                          setEditingVehicle(null);
                        }
                      }}
                      className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  )}
                </div>
              </form>

              {/* ENTRADAS LANÇADAS NESTE VEÍCULO */}
              {(() => {
                const vehicleIncomes = allIncomes.filter(t => 
                  (t.description || '').toLowerCase().includes(editingVehicle.name.toLowerCase()) || 
                  (t.notes || '').toLowerCase().includes(editingVehicle.name.toLowerCase())
                ).sort((a, b) => b.date.localeCompare(a.date));
                
                return (
                  <div className="bg-slate-900 border border-white/5 rounded-xl p-3 mt-4">
                    <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider mb-2 block flex justify-between">
                      <span>Lançamentos</span>
                      <span className="text-emerald-400">{formatBRL(vehicleIncomes.reduce((acc, t) => acc + t.amount, 0))}</span>
                    </span>
                    {vehicleIncomes.length === 0 ? (
                      <div className="text-[11px] text-white/40 italic py-2 text-center">Nenhuma entrada encontrada para este veículo.</div>
                    ) : (
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                        {vehicleIncomes.map(inc => (
                          <div key={inc.id} className="flex justify-between items-center bg-[#161618] p-2 rounded-lg border border-white/5">
                            <div>
                              <div className="text-[11px] font-semibold text-white">{inc.description}</div>
                              <div className="text-[9px] text-white/40">
                                {inc.date.split('-').reverse().join('/')}
                              </div>
                            </div>
                            <div className="text-[11px] font-bold text-emerald-400">
                              {formatBRL(inc.amount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            ) : (
              /* FORMULÁRIO DE NOVO CARRO */
              <form onSubmit={handleCreateVehicle} className="space-y-3 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  + Cadastrar Novo Carro
                </span>
                <div>
                  <label className="text-[11px] font-semibold text-white/70 mb-1 block">Nome do Carro *</label>
                  <input
                    type="text"
                    placeholder="Ex: Corolla, HB20, Gol, Ônix..."
                    value={newVehicleName}
                    onChange={(e) => setNewVehicleName(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 text-white font-bold text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-white/70 mb-1 block">Modelo (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: 1.0 Flex"
                      value={newVehicleModel}
                      onChange={(e) => setNewVehicleModel(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-white/70 mb-1 block">Placa (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: ABC-1234"
                      value={newVehiclePlate}
                      onChange={(e) => setNewVehiclePlate(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Carro</span>
                </button>
              </form>
            )}

            {/* LISTA DE CARROS PARA EDITAR / EXCLUIR */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider block">
                Carros Cadastrados ({(vehicles || []).length})
              </span>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {(vehicles || []).length === 0 ? (
                  <p className="text-xs text-white/40 italic p-3 text-center">Nenhum carro cadastrado.</p>
                ) : (
                  (vehicles || []).map((v) => (
                    <div
                      key={v.id}
                      className="p-3 bg-slate-800/80 border border-white/10 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-xs font-bold text-white">{v.name}</p>
                          {v.licensePlate && (
                            <p className="text-[10px] text-white/50">{v.licensePlate}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingVehicle(v)}
                          className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          title="Editar Nome do Carro"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        {onDeleteVehicle && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Deseja realmente excluir o carro ${v.name}?`)) {
                                onDeleteVehicle(v.id);
                              }
                            }}
                            className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                            title="Excluir Carro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
