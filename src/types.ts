export type TransactionCategory =
  | 'Moradia'
  | 'Condomínio'
  | 'Energia'
  | 'Fatura de Cartão'
  | 'Internet/TV'
  | 'Alimentação'
  | 'Combustível'
  | 'Carregamento'
  | 'Manutenção Carro'
  | 'IPVA/Licenciamento'
  | 'Seguro do Carro'
  | 'Financiamento'
  | 'Saúde'
  | 'Ração/Alimentação Pet'
  | 'Veterinário/Pet'
  | 'Vacinas/Remédios Pet'
  | 'Banho e Tosa'
  | 'Acessórios/Brinquedos Pet'
  | 'Lazer/Restaurante'
  | 'Salário/Renda'
  | 'Investimento'
  | 'Fatura'
  | 'Educação'
  | 'Previsível'
  | 'Empresa'
  | 'Outros';

export type CategoryScope = 'casa' | 'pet' | 'pagamentos' | 'empresa' | 'geral';

export const SCOPE_CATEGORIES: Record<CategoryScope, TransactionCategory[]> = {
  casa: ['Moradia', 'Condomínio', 'Energia', 'Internet/TV', 'Outros'],
  pet: ['Ração/Alimentação Pet', 'Veterinário/Pet', 'Vacinas/Remédios Pet', 'Banho e Tosa', 'Acessórios/Brinquedos Pet', 'Outros'],
  pagamentos: ['Fatura de Cartão', 'Fatura', 'Financiamento', 'Saúde', 'Educação', 'Outros'],
  empresa: ['Empresa', 'Financiamento', 'Outros'],
  geral: ['Alimentação', 'Saúde', 'Lazer/Restaurante', 'Educação', 'Investimento', 'Salário/Renda', 'Outros']
};

export type PaymentMethod = 'PIX' | 'Cartão de Crédito' | 'Boleto' | 'Débito' | 'Dinheiro' | 'Transferência' | 'SEM PAGAMENTO';

export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  scope: CategoryScope;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  paid: boolean;
  notes?: string;
  recurring?: boolean;
  installment?: { current: number; total: number };
  excludeFromTotals?: boolean;
  barcode?: string;
  pixCode?: string;
}

export interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  category: TransactionCategory;
  scope: CategoryScope;
  paymentMethod: PaymentMethod;
  status: 'pendente' | 'pago' | 'atrasado';
  paidDate?: string;
  recurring: 'mensal' | 'anual' | 'semanal' | 'unico';
  recipient?: string;
  notes?: string;
  autoPay?: boolean;
  excludeFromTotals?: boolean;
  barcode?: string;
  pixCode?: string;
  installment?: { current: number; total: number };
}

export interface HomeUtilityReading {
  id: string;
  month: string; // YYYY-MM
  type: 'Energia' | 'Condomínio' | 'Internet' | 'Financiamento';
  consumption: number; // kWh, m³, etc.
  cost: number;
  dueDay?: number; // Dia de vencimento (1-31)
}

export interface HomeTask {
  id: string;
  title: string;
  category: string;
  frequency: string;
  lastDoneDate?: string;
  nextDueDate: string;
  estimatedCost: number;
  completed: boolean;
}

export interface MonthlyBudget {
  category: TransactionCategory;
  allocated: number;
}

export interface CreditCard {
  id: string;
  name: string; // e.g. Caixa, Itaú, Nubank
  bestDay: number; // 1-31 (Melhor dia para compra)
  dueDay?: number; // 1-31 (Dia do vencimento)
  limit?: number; // Optional limit
  customLogo?: string; // Imagem customizada em Base64
}

export type PetSpecies = 'cachorro' | 'gato' | 'passaro' | 'peixe' | 'outros';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  birthDate?: string; // YYYY-MM-DD
  weightKg?: number;
  microchip?: string;
  notes?: string;
  avatarUrl?: string;
}

export type PetCareCategory = 
  | 'Vacina' 
  | 'Veterinário' 
  | 'Medicamento' 
  | 'Ração/Alimentação' 
  | 'Banho e Tosa' 
  | 'Acessórios/Brinquedos' 
  | 'Outros';

export interface PetCareRecord {
  id: string;
  petId: string;
  petName: string;
  title: string;
  category: PetCareCategory;
  date: string; // YYYY-MM-DD
  cost: number;
  nextDueDate?: string; // Data da próxima vacina/consulta (YYYY-MM-DD)
  notes?: string;
  completed?: boolean;
}

export interface Vehicle {
  id: string;
  name: string;
  model?: string;
  licensePlate?: string;
  year?: string;
  isCompany?: boolean;
  currentKm?: number;
  notes?: string;
}

export interface VehicleService {
  id: string;
  vehicleId: string;
  type: 'troca_oleo' | 'manutencao' | 'pneu' | 'documentacao' | 'outro';
  description: string;
  date: string;
  km?: number;
  cost: number;
  nextKm?: number;
  nextDate?: string;
  notes?: string;
}

export type ModuleId = 'resumo' | 'pet' | 'empresa' | 'contas' | 'entradas' | 'relatorios';

export interface CompanyProfile {
  name: string;
  tradingName?: string; // Nome Fantasia
  document: string; // CNPJ / CPF
  phone?: string;
  email?: string;
  address?: string;
  pixKey?: string;
  bankDetails?: string;
  notes?: string;
}

export interface CompanyClient {
  id: string;
  name: string;
  document?: string; // CPF / CNPJ
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type CompanyDocumentType = 'orcamento' | 'fatura' | 'recibo' | 'pedido';
export type CompanyDocumentStatus = 'rascunho' | 'enviado' | 'pago' | 'cancelado';

export interface CompanyDocumentItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CompanyDocument {
  id: string;
  code: string; // e.g. #ORC-001, #FAT-002
  type: CompanyDocumentType;
  clientId: string;
  clientName: string;
  clientDocument?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  items: CompanyDocumentItem[];
  totalAmount: number;
  discount?: number;
  status: CompanyDocumentStatus;
  paymentTerms?: string; // Ex: PIX na entrega, 50% entrada
  notes?: string;
  createdAt: string;
}

export interface ModuleSetting {
  id: ModuleId;
  label: string;
  description: string;
  iconName: string;
  enabled: boolean;
  isRequired?: boolean;
}

export function isVariableBill(title: string = '', category: string = ''): boolean {
  const t = (title || '').toLowerCase();
  const c = (category || '').toLowerCase();
  return (
    c.includes('fatura') ||
    c.includes('cartão') ||
    c.includes('cartao') ||
    c.includes('energia') ||
    t.includes('cartão') ||
    t.includes('cartao') ||
    t.includes('fatura') ||
    t.includes('energia') ||
    t.includes('luz')
  );
}
