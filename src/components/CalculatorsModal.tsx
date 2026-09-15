import React, { useState } from 'react';
import { X, Calculator, Fuel, Shield } from 'lucide-react';
import { formatBRL } from '../lib/storage';

interface CalculatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyFixedExpenses: number;
}

export const CalculatorsModal: React.FC<CalculatorsModalProps> = ({
  isOpen,
  onClose,
  monthlyFixedExpenses,
}) => {
  const [activeTab, setActiveTab] = useState<'fuel' | 'reserve' | 'simple'>('fuel');

  // Fuel States
  const [etanol, setEtanol] = useState(3.89);
  const [gasolina, setGasolina] = useState(5.79);

  // Fuel calculation
  const ratio = gasolina > 0 ? (etanol / gasolina) * 100 : 0;
  const winner = ratio < 70 ? 'Etanol' : 'Gasolina';
  const savingPercent = ratio < 70 ? (70 - ratio).toFixed(1) : (ratio - 70).toFixed(1);

  // Reserve States
  const [monthsCount, setMonthsCount] = useState<number>(6);
  const totalReserve = monthlyFixedExpenses * monthsCount;

  // Simple Calculator States
  const [calcDisplay, setCalcDisplay] = useState<string>('0');
  const [calcPrev, setCalcPrev] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setCalcDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? digit : calcDisplay + digit);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setCalcDisplay('0.');
      setWaitingForOperand(false);
    } else if (!calcDisplay.includes('.')) {
      setCalcDisplay(calcDisplay + '.');
    }
  };

  const clearCalc = () => {
    setCalcDisplay('0');
    setCalcPrev(null);
    setCalcOp(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOp: string) => {
    const inputValue = parseFloat(calcDisplay);

    if (calcPrev === null) {
      setCalcPrev(inputValue);
    } else if (calcOp) {
      const currentValue = calcPrev || 0;
      let newValue = currentValue;
      if (calcOp === '+') newValue = currentValue + inputValue;
      if (calcOp === '-') newValue = currentValue - inputValue;
      if (calcOp === '*') newValue = currentValue * inputValue;
      if (calcOp === '/') newValue = inputValue !== 0 ? currentValue / inputValue : 0;

      setCalcPrev(newValue);
      setCalcDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setCalcOp(nextOp);
  };

  const handleEquals = () => {
    if (!calcOp || calcPrev === null) return;
    const inputValue = parseFloat(calcDisplay);
    let newValue = calcPrev;
    if (calcOp === '+') newValue = calcPrev + inputValue;
    if (calcOp === '-') newValue = calcPrev - inputValue;
    if (calcOp === '*') newValue = calcPrev * inputValue;
    if (calcOp === '/') newValue = inputValue !== 0 ? calcPrev / inputValue : 0;

    setCalcDisplay(String(newValue));
    setCalcPrev(null);
    setCalcOp(null);
    setWaitingForOperand(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#121214] text-white w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-[#1A1A1C]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Calculadoras Financeiras</h2>
              <p className="text-xs text-white/50">Simulações de combustível, reserva de emergência e matemática simples</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="shrink-0 flex items-center p-2 gap-1.5 bg-[#161618] border-b border-white/5">
          <button
            onClick={() => setActiveTab('fuel')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              activeTab === 'fuel'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Etanol x Gasolina</span>
          </button>
          <button
            onClick={() => setActiveTab('reserve')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              activeTab === 'reserve'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Reserva de Emergência</span>
          </button>
          <button
            onClick={() => setActiveTab('simple')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition ${
              activeTab === 'simple'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculadora Simples</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {activeTab === 'fuel' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">Preço Etanol (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={etanol}
                    onChange={(e) => setEtanol(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1A1A1C] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-white/70">Preço Gasolina (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={gasolina}
                    onChange={(e) => setGasolina(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1A1A1C] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/10 text-center space-y-2">
                <p className="text-xs text-white/50 font-medium">Resultado do Cálculo (Proporção 70%)</p>
                <div className="text-2xl font-black text-emerald-400">
                  Vale a pena abastecer com {winner}!
                </div>
                <p className="text-xs text-white/70">
                  O etanol está custando <strong className="text-white">{ratio.toFixed(1)}%</strong> do preço da gasolina. Economia estimada de <strong className="text-emerald-400">{savingPercent}%</strong>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'reserve' && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Custo Fixo Mensal Atual</label>
                <div className="bg-[#1A1A1C] border border-white/10 rounded-2xl px-4 py-3 text-sm text-emerald-400 font-extrabold">
                  {formatBRL(monthlyFixedExpenses)}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Meses de Cobertura Desejados</label>
                <div className="flex items-center gap-2">
                  {[3, 6, 12].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMonthsCount(m)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition border ${
                        monthsCount === m
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-[#1A1A1C] text-white/70 border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {m} Meses
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#1A1A1C] p-5 rounded-2xl border border-white/10 text-center space-y-2">
                <p className="text-xs text-white/50 font-medium">Meta de Reserva Recomendada</p>
                <div className="text-3xl font-black text-emerald-400">
                  {formatBRL(totalReserve)}
                </div>
                <p className="text-xs text-white/60">
                  Sua reserva cobrirá {monthsCount} meses do seu custo de vida atual sem sobressaltos.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'simple' && (
            <div className="space-y-4">
              <div className="bg-[#1A1A1C] p-4 rounded-2xl border border-white/10 text-right space-y-1">
                <div className="text-xs text-white/40 font-mono h-4">
                  {calcPrev !== null ? `${calcPrev} ${calcOp}` : ''}
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono truncate">
                  {calcDisplay}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={clearCalc}
                  className="py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-sm transition border border-rose-500/20"
                >
                  C
                </button>
                <button
                  onClick={() => performOperation('/')}
                  className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition border border-emerald-500/20"
                >
                  /
                </button>
                <button
                  onClick={() => performOperation('*')}
                  className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition border border-emerald-500/20"
                >
                  *
                </button>
                <button
                  onClick={() => performOperation('-')}
                  className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition border border-emerald-500/20"
                >
                  -
                </button>

                {[7, 8, 9].map((n) => (
                  <button
                    key={n}
                    onClick={() => inputDigit(String(n))}
                    className="py-3 bg-[#1A1A1C] hover:bg-white/10 text-white font-medium rounded-xl text-sm transition border border-white/5"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => performOperation('+')}
                  className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold rounded-xl text-sm transition border border-emerald-500/20"
                >
                  +
                </button>

                {[4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => inputDigit(String(n))}
                    className="py-3 bg-[#1A1A1C] hover:bg-white/10 text-white font-medium rounded-xl text-sm transition border border-white/5"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={handleEquals}
                  className="row-span-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center"
                >
                  =
                </button>

                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => inputDigit(String(n))}
                    className="py-3 bg-[#1A1A1C] hover:bg-white/10 text-white font-medium rounded-xl text-sm transition border border-white/5"
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => inputDigit('0')}
                  className="py-3 col-span-2 bg-[#1A1A1C] hover:bg-white/10 text-white font-medium rounded-xl text-sm transition border border-white/5"
                >
                  0
                </button>
                <button
                  onClick={inputDot}
                  className="py-3 bg-[#1A1A1C] hover:bg-white/10 text-white font-medium rounded-xl text-sm transition border border-white/5"
                >
                  ,
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 p-4 sm:px-6 sm:py-4 border-t border-white/10 bg-[#1A1A1C] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#1A1A1C] hover:bg-white/10 text-white text-xs font-semibold rounded-full transition border border-white/10"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
