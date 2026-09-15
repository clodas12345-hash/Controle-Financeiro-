import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as XLSX from 'xlsx';
import { loadAllAppData } from './storage';

export function exportAppToExcel(appData?: ReturnType<typeof loadAllAppData>) {
  const data = appData || loadAllAppData();

  const wb = XLSX.utils.book_new();

  const mapScopeName = (scope?: string) => {
    switch (scope) {
      case 'casa': return 'Casa';
      case 'pet': return 'Pet';
      case 'empresa': return 'Empresa';
      case 'pagamentos': return 'Pagamentos';
      default: return 'Geral';
    }
  };

  // 0. Always add a "Resumo Geral" sheet so workbook is NEVER empty
  const summaryRows = [
    { 'Informação': 'Sistema', 'Detalhe': 'Controle Financeiro' },
    { 'Informação': 'Data de Exportação', 'Detalhe': new Date().toLocaleString('pt-BR') },
    { 'Informação': 'Total de Lançamentos', 'Detalhe': String(data.transactions?.length || 0) },
    { 'Informação': 'Total de Contas e Faturas', 'Detalhe': String(data.bills?.length || 0) },
    { 'Informação': 'Total de Cartões de Crédito', 'Detalhe': String(data.creditCards?.length || 0) },
    { 'Informação': 'Total de Veículos', 'Detalhe': String(data.vehicles?.length || 0) },
    { 'Informação': 'Total de Serviços de Veículo', 'Detalhe': String(data.vehicleServices?.length || 0) },
    { 'Informação': 'Total de Leituras da Casa', 'Detalhe': String(data.homeReadings?.length || 0) },
    { 'Informação': 'Total de Pets', 'Detalhe': String(data.pets?.length || 0) },
    { 'Informação': 'Total de Clientes Empresa', 'Detalhe': String(data.companyClients?.length || 0) },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Geral');

  // 1. Transações / Lançamentos
  const formattedTransactions = (data.transactions && data.transactions.length > 0)
    ? data.transactions.map((t) => ({
        'Data': t.date || '',
        'Tipo': t.type === 'receita' ? 'Receita (+)' : 'Despesa (-)',
        'Categoria': t.category || '',
        'Descrição': t.description || '',
        'Âmbito / Escopo': mapScopeName(t.scope),
        'Valor (R$)': t.amount || 0,
        'Forma de Pagamento': t.paymentMethod || 'Outros',
        'Status': t.paid ? 'Pago / Concluído' : 'Pendente',
        'Parcelas': t.installment ? `${t.installment.current}/${t.installment.total}` : '1/1',
        'Observações': t.notes || '',
      }))
    : [{
        'Data': '',
        'Tipo': '',
        'Categoria': '',
        'Descrição': '(Nenhum lançamento adicionado ainda)',
        'Âmbito / Escopo': '',
        'Valor (R$)': 0,
        'Forma de Pagamento': '',
        'Status': '',
        'Parcelas': '',
        'Observações': '',
      }];
  const wsTransactions = XLSX.utils.json_to_sheet(formattedTransactions);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Transações');

  // 2. Contas & Faturas a Pagar
  const formattedBills = (data.bills && data.bills.length > 0)
    ? data.bills.map((b) => ({
        'Título / Conta': b.title || '',
        'Categoria': b.category || '',
        'Data Vencimento': b.dueDate || '',
        'Valor (R$)': b.amount || 0,
        'Beneficiário / Cedente': b.recipient || '',
        'Escopo': mapScopeName(b.scope),
        'Status': b.status === 'pago' ? 'Paga' : b.status === 'atrasado' ? 'Atrasada' : 'Pendente',
        'Data de Pagamento': b.paidDate || '',
        'Frequência': b.recurring || 'mensal',
        'Método de Pagamento': b.paymentMethod || '',
        'Observações': b.notes || '',
      }))
    : [{
        'Título / Conta': '(Nenhuma conta cadastrada ainda)',
        'Categoria': '',
        'Data Vencimento': '',
        'Valor (R$)': 0,
        'Beneficiário / Cedente': '',
        'Escopo': '',
        'Status': '',
        'Data de Pagamento': '',
        'Frequência': '',
        'Método de Pagamento': '',
        'Observações': '',
      }];
  const wsBills = XLSX.utils.json_to_sheet(formattedBills);
  XLSX.utils.book_append_sheet(wb, wsBills, 'Contas e Faturas');

  // 3. Cartões de Crédito
  const formattedCards = (data.creditCards && data.creditCards.length > 0)
    ? data.creditCards.map((c) => ({
        'Nome do Cartão': c.name || '',
        'Banco': c.bank || '',
        'Limite Total (R$)': c.limit || 0,
        'Dia Fechamento Fatura': c.closingDay || '',
        'Dia Vencimento Fatura': c.dueDay || '',
        'Cor / Identificador': c.color || '',
      }))
    : [{
        'Nome do Cartão': '(Nenhum cartão cadastrado)',
        'Banco': '',
        'Limite Total (R$)': 0,
        'Dia Fechamento Fatura': '',
        'Dia Vencimento Fatura': '',
        'Cor / Identificador': '',
      }];
  const wsCards = XLSX.utils.json_to_sheet(formattedCards);
  XLSX.utils.book_append_sheet(wb, wsCards, 'Cartões de Crédito');

  // 4. Orçamentos Mensais
  if (data.budgets && data.budgets.length > 0) {
    const formattedBudgets = data.budgets.map((bg) => ({
      'Categoria': bg.category || '',
      'Limite Alocado (R$)': bg.allocated || 0,
    }));
    const wsBudgets = XLSX.utils.json_to_sheet(formattedBudgets);
    XLSX.utils.book_append_sheet(wb, wsBudgets, 'Orçamentos Mensais');
  }

  // 5. Veículos Cadastrados & Serviços
  if (data.vehicles && data.vehicles.length > 0) {
    const formattedVehicles = data.vehicles.map((v) => ({
      'Nome': v.name || '',
      'Modelo': v.model || '',
      'Placa': v.licensePlate || '',
      'KM Atual': v.currentKm || '',
    }));
    const wsVehicles = XLSX.utils.json_to_sheet(formattedVehicles);
    XLSX.utils.book_append_sheet(wb, wsVehicles, 'Veículos');
  }

  if (data.vehicleServices && data.vehicleServices.length > 0) {
    const formattedServices = data.vehicleServices.map((s) => ({
      'Serviço': s.title || '',
      'Tipo': s.type || '',
      'Data': s.date || '',
      'KM': s.km || '',
      'Custo (R$)': s.cost || 0,
      'Observações': s.notes || '',
    }));
    const wsServices = XLSX.utils.json_to_sheet(formattedServices);
    XLSX.utils.book_append_sheet(wb, wsServices, 'Manutenção Veicular');
  }

  // 6. Leituras e Gastos da Casa
  if (data.homeReadings && data.homeReadings.length > 0) {
    const formattedReadings = data.homeReadings.map((r) => ({
      'Mês Referência': r.month || '',
      'Tipo de Conta': r.type || '',
      'Consumo Registrado': r.consumption || 0,
      'Custo Total (R$)': r.cost || 0,
      'Dia do Vencimento': r.dueDay || '',
    }));
    const wsReadings = XLSX.utils.json_to_sheet(formattedReadings);
    XLSX.utils.book_append_sheet(wb, wsReadings, 'Consumo Casa');
  }

  // 7. Pets & Cuidados
  if (data.pets && data.pets.length > 0) {
    const formattedPets = data.pets.map((p) => ({
      'Nome': p.name || '',
      'Espécie': p.species || '',
      'Raça': p.breed || '',
      'Peso (kg)': p.weightKg || '',
      'Observações': p.notes || '',
    }));
    const wsPets = XLSX.utils.json_to_sheet(formattedPets);
    XLSX.utils.book_append_sheet(wb, wsPets, 'Pets');
  }

  // 8. Clientes & Documentos Empresa
  if (data.companyClients && data.companyClients.length > 0) {
    const formattedClients = data.companyClients.map((c) => ({
      'Nome': c.name || '',
      'Documento': c.document || '',
      'Telefone': c.phone || '',
      'Email': c.email || '',
      'Endereço': c.address || '',
    }));
    const wsClients = XLSX.utils.json_to_sheet(formattedClients);
    XLSX.utils.book_append_sheet(wb, wsClients, 'Clientes Empresa');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Controle_Financeiro_Planilha_${dateStr}.xlsx`;

  // Write workbook to binary array
  try {
    
    if (Capacitor.isNativePlatform()) {
      const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      
      const saveAndShare = async () => {
        try {
          // Request permissions first
          const permStatus = await Filesystem.checkPermissions();
          if (permStatus.publicStorage !== 'granted') {
            await Filesystem.requestPermissions();
          }

          // Save to public Downloads folder
          const result = await Filesystem.writeFile({
            path: 'Download/' + fileName,
            data: base64,
            directory: Directory.ExternalStorage
          });
          
          alert('Planilha salva com sucesso na pasta DOWNLOADS do seu celular!');
          
          // Still offer to share to WhatsApp
          await Share.share({
            title: 'Planilha Controle Financeiro',
            text: `Planilha financeira gerada em ${new Date().toLocaleDateString('pt-BR')}`,
            url: result.uri,
            dialogTitle: 'Compartilhar Planilha'
          });
        } catch (err) {
          console.warn('Native share/write failed:', err);
          alert('Erro ao salvar no celular. Tente verificar as permissões.');
        }
      };
      saveAndShare();
      return;
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // 1. Try Web Share API (native share on Android/iOS to WhatsApp, Drive, Excel)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      const file = new File([blob], fileName, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        navigator
          .share({
            title: 'Planilha Controle Financeiro',
            text: `Planilha financeira gerada em ${new Date().toLocaleDateString('pt-BR')}`,
            files: [file],
          })
          .catch((err) => {
            if (err.name !== 'AbortError') {
              console.warn('Share excel failed, falling back to download:', err);
              downloadBlob(blob, fileName);
            }
          });
        return;
      }
    }

    // 2. Browser download fallback
    downloadBlob(blob, fileName);
  } catch (err) {
    console.warn('XLSX custom write error, falling back to writeFile:', err);
    XLSX.writeFile(wb, fileName);
  }
}

function downloadBlob(blob: Blob, fileName: string) {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 1500);
  } catch (e) {
    console.error('Download blob error:', e);
  }
}
