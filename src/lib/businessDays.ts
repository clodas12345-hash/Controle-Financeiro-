/**
 * businessDays.ts
 * Utilitários para detecção de fins de semana e feriados bancários nacionais (Brasil),
 * e cálculo do próximo dia útil de vencimento de contas conforme o Código Civil
 * (Art. 132 do Código Civil e Lei 7.089/83).
 */

export interface DueDateBusinessInfo {
  originalDate: string; // YYYY-MM-DD
  formattedOriginal: string; // DD/MM/YYYY
  originalDayOfWeek: string; // Sábado, Domingo, Sexta-feira...
  isNonBusinessDay: boolean;
  reason?: 'sabado' | 'domingo' | 'feriado';
  holidayName?: string;
  effectiveDueDate: string; // YYYY-MM-DD (próximo dia útil)
  formattedEffective: string; // DD/MM/YYYY
  effectiveDayOfWeek: string;
  daysDeferred: number;
  noticeText: string;
  shortNotice: string;
}

const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

const SHORT_DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDateFromParts(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const cleanDate = dateStr.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Cálculo do Domingo de Páscoa (Algoritmo de Meeus/Jones/Butcher)
 */
export function getEasterSunday(year: number): { year: number; month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Março, 4 = Abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

/**
 * Cache de feriados por ano
 */
const holidaysCache: Record<number, Record<string, string>> = {};

/**
 * Retorna os feriados nacionais e bancários do Brasil para determinado ano
 */
export function getBrazilianHolidays(year: number): Record<string, string> {
  if (holidaysCache[year]) {
    return holidaysCache[year];
  }

  const holidays: Record<string, string> = {
    [`${year}-01-01`]: 'Ano Novo (Confraternização Universal)',
    [`${year}-04-21`]: 'Tiradentes',
    [`${year}-05-01`]: 'Dia do Trabalho',
    [`${year}-09-07`]: 'Independência do Brasil',
    [`${year}-10-12`]: 'Nossa Senhora Aparecida',
    [`${year}-11-02`]: 'Finados',
    [`${year}-11-15`]: 'Proclamação da República',
    [`${year}-11-20`]: 'Dia Nacional da Consciência Negra',
    [`${year}-12-25`]: 'Natal',
    [`${year}-12-31`]: 'Fim de Ano Bancário',
  };

  const easter = getEasterSunday(year);
  
  // Feriados móveis calculados a partir da Páscoa
  const carnavSeg = new Date(year, easter.month - 1, easter.day - 48, 12, 0, 0);
  const carnavTerc = new Date(year, easter.month - 1, easter.day - 47, 12, 0, 0);
  const sextaSanta = new Date(year, easter.month - 1, easter.day - 2, 12, 0, 0);
  const corpusChristi = new Date(year, easter.month - 1, easter.day + 60, 12, 0, 0);

  const fmt = (d: Date) => formatDateFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate());

  holidays[fmt(carnavSeg)] = 'Carnaval (Segunda-feira)';
  holidays[fmt(carnavTerc)] = 'Carnaval (Terça-feira)';
  holidays[fmt(sextaSanta)] = 'Sexta-feira Santa (Paixão de Cristo)';
  holidays[fmt(corpusChristi)] = 'Corpus Christi';

  holidaysCache[year] = holidays;
  return holidays;
}

/**
 * Verifica se uma data específica é dia útil (não é sábado, domingo nem feriado bancário)
 */
export function isBusinessDay(dateStr: string): {
  isBusinessDay: boolean;
  dayOfWeek: number;
  dayOfWeekName: string;
  reason?: 'sabado' | 'domingo' | 'feriado';
  holidayName?: string;
} {
  const clean = (dateStr || '').split('T')[0];
  const parts = clean.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return { isBusinessDay: true, dayOfWeek: 1, dayOfWeekName: 'Segunda-feira' };
  }

  const [year, month, day] = parts;
  const dt = new Date(year, month - 1, day, 12, 0, 0);
  const dayOfWeek = dt.getDay(); // 0 = Domingo, 6 = Sábado
  const dayOfWeekName = DAY_NAMES[dayOfWeek];

  if (dayOfWeek === 0) {
    return { isBusinessDay: false, dayOfWeek, dayOfWeekName, reason: 'domingo' };
  }

  if (dayOfWeek === 6) {
    return { isBusinessDay: false, dayOfWeek, dayOfWeekName, reason: 'sabado' };
  }

  const holidays = getBrazilianHolidays(year);
  if (holidays[clean]) {
    return {
      isBusinessDay: false,
      dayOfWeek,
      dayOfWeekName,
      reason: 'feriado',
      holidayName: holidays[clean],
    };
  }

  return { isBusinessDay: true, dayOfWeek, dayOfWeekName };
}

/**
 * Retorna o próximo dia útil a partir de uma data fornecida (YYYY-MM-DD).
 * Se a própria data já for dia útil, retorna ela mesma.
 */
export function getEffectiveDueDate(dateStr: string): string {
  if (!dateStr) return '';
  let current = dateStr.split('T')[0];
  const parts = current.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return dateStr;
  }

  let dt = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);

  for (let i = 0; i < 15; i++) {
    const formatted = formatDateFromParts(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    const check = isBusinessDay(formatted);
    if (check.isBusinessDay) {
      return formatted;
    }
    // Avança 1 dia
    dt.setDate(dt.getDate() + 1);
  }

  return current;
}

/**
 * Retorna informações completas sobre o vencimento de uma conta e a postergação para o próximo dia útil
 */
export function getDueDateBusinessInfo(dateStr: string): DueDateBusinessInfo {
  const clean = (dateStr || '').split('T')[0];
  const formattedOriginal = formatDateBR(clean);

  const check = isBusinessDay(clean);

  if (check.isBusinessDay) {
    return {
      originalDate: clean,
      formattedOriginal,
      originalDayOfWeek: check.dayOfWeekName,
      isNonBusinessDay: false,
      effectiveDueDate: clean,
      formattedEffective: formattedOriginal,
      effectiveDayOfWeek: check.dayOfWeekName,
      daysDeferred: 0,
      noticeText: '',
      shortNotice: '',
    };
  }

  const effectiveDueDate = getEffectiveDueDate(clean);
  const effectiveParts = effectiveDueDate.split('-').map(Number);
  const effectiveDt = new Date(effectiveParts[0], effectiveParts[1] - 1, effectiveParts[2], 12, 0, 0);
  const effectiveDayOfWeek = DAY_NAMES[effectiveDt.getDay()];
  const effectiveShortDay = SHORT_DAY_NAMES[effectiveDt.getDay()];
  const formattedEffective = formatDateBR(effectiveDueDate);

  // Calcular diferença de dias
  const origParts = clean.split('-').map(Number);
  const origDt = new Date(origParts[0], origParts[1] - 1, origParts[2], 12, 0, 0);
  const daysDeferred = Math.round((effectiveDt.getTime() - origDt.getTime()) / (1000 * 60 * 60 * 24));

  let reasonLabel = '';
  if (check.reason === 'sabado') {
    reasonLabel = 'um Sábado';
  } else if (check.reason === 'domingo') {
    reasonLabel = 'um Domingo';
  } else if (check.reason === 'feriado') {
    reasonLabel = `um Feriado (${check.holidayName})`;
  }

  const noticeText = `Esta conta vence em ${reasonLabel} (${formattedOriginal}). Conforme o Código Civil (Art. 132) e as regras da FEBRABAN, o pagamento pode ser efetuado sem juros ou encargos até o próximo dia útil: ${effectiveDayOfWeek}, ${formattedEffective}.`;
  
  const shortNotice = `Próx. dia útil: ${effectiveShortDay}, ${formattedEffective.slice(0, 5)}`;

  return {
    originalDate: clean,
    formattedOriginal,
    originalDayOfWeek: check.dayOfWeekName,
    isNonBusinessDay: true,
    reason: check.reason,
    holidayName: check.holidayName,
    effectiveDueDate,
    formattedEffective,
    effectiveDayOfWeek,
    daysDeferred,
    noticeText,
    shortNotice,
  };
}
