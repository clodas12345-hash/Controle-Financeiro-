import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Allow CORS for PWABuilder and external tools checking manifest & sw
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  // Serve static files from public directory explicitly
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));

  app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(publicPath, 'manifest.json'));
  });

  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.sendFile(path.join(publicPath, 'sw.js'));
  });

  app.post("/api/parse-receipt", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Imagem não fornecida" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Você é um especialista em OCR e extração de dados financeiros de telas de aplicativos de motorista de aplicativo (UBER e 99), recibos e painéis de carros.

MUITO IMPORTANTE: A imagem pode conter VÁRIOS aplicativos abertos ao mesmo tempo em tela dividida (split-screen). Analise a imagem inteira e extraia os dados de TODOS os aplicativos e painéis visíveis simultaneamente. Procure com muita atenção na parte superior, na esquerda e na direita.

REGRAS DE IDENTIFICAÇÃO DE APPS E DADOS:

1. APLICATIVO UBER:
   - Procure por textos como "Estatísticas", "Viagens", "Detalhamento", "Online".
   - "earnings": O valor total em R$ (ex: 925.06).
   - "rides": A quantidade de "Viagens" (ex: 41).

2. APLICATIVO 99:
   - Procure por "Seus ganhos", "Corridas", "Entregas", "Diários", "Ganhos pagos em dinheiro".
   - "earnings": O valor total exibido (ex: 236.60).
   - "rides": O número de Solicitações/Corridas (ex: 6).

3. PAINEL DO VEÍCULO:
   - Procure por quilometragem e bateria ("km", "%").
   - "kmDriven": Priorize a quilometragem do "TRIP A" ou "TRIP B" ou "Trip" (ex: "TRIP A 2.1km" -> 2.1).
   - "batteryRemaining": Porcentagem (%) de bateria restante (ex: "99%" -> 99).

RETORNE APENAS UM OBJETO JSON COM A SEGUINTE ESTRUTURA EXATA (sem markdown):
{
  "kmDriven": number | null,
  "batteryRemaining": number | null,
  "uber": {
    "earnings": number | null,
    "rides": number | null
  },
  "99": {
    "earnings": number | null,
    "rides": number | null
  },
  "foodExpenses": [],
  "carExpenses": []
}

ATENÇÃO: Números devem ser puros, formato decimal (ex: 129.21). Retorne os dados caso os encontre, não retorne null se o dado estiver visível. Esforce-se para ler os números corretamente.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          prompt,
          { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } }
        ]
      });

      const rawText = response.text || '';
      console.log('AI Response rawText:', rawText);
      let parsedData;
      try {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      } catch (parseErr) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Invalid JSON response from AI model");
        }
      }

      console.log('Parsed Data:', parsedData);
      res.json({ success: true, parsed: parsedData });
    } catch (error: any) {
      console.error("Parse receipt error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // AI Parse Endpoint
  app.post("/api/ai-parse", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Texto não fornecido" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        const parsed = smartFallbackParse(text);
        return res.json({ success: true, parsed, source: 'fallback' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Você é o assistente inteligente de um aplicativo de controle financeiro pessoal e gestão (casa, carro, contas e transações) no Brasil.
O usuário enviou a seguinte mensagem em linguagem natural: "${text}"

Analise o texto e extraia as informações em formato JSON estrito (sem formatação markdown extra, apenas JSON puro):
{
  "targetModule": "transactions" | "bills" | "vehicles" | "house",
  "data": {
    "description": "Nome descritivo da transação ou conta",
    "amount": número decimal (ex: 150.00),
    "type": "despesa" ou "receita",
    "category": uma das categorias exatas: ["Moradia", "Condomínio", "Energia", "Água/Gás", "Internet/TV", "Supermercado", "Combustível", "Manutenção Carro", "IPVA/Licenciamento", "Seguro Veicular", "Financiamento", "Saúde", "Lazer/Restaurante", "Salário/Renda", "Investimento", "Outros"],
    "scope": "casa" | "carro" | "pagamentos" | "geral",
    "date": "YYYY-MM-DD" (data de hoje ou a mencionada, hoje é ${new Date().toISOString().slice(0, 10)}),
    "paymentMethod": "PIX" | "Cartão de Crédito" | "Boleto" | "Débito" | "Dinheiro" | "Transferência",
    "notes": "observações adicionais extraídas"
  }
}
Responda APENAS com o objeto JSON válido.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      const rawText = response.text || '';
      let parsedData;
      try {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      } catch (parseErr) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Invalid JSON response from AI model");
        }
      }

      res.json({ success: true, parsed: parsedData, source: 'gemini' });
    } catch (error: any) {
      console.error("AI Parse error:", error);
      const parsed = smartFallbackParse(req.body.text || '');
      res.json({ success: true, parsed, source: 'fallback_error', error: error.message });
    }
  });

  app.post("/api/process-bill", async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Imagem não fornecida" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY não configurada no servidor." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Você é um especialista em OCR e extração de dados de contas/boletos brasileiros.
Analise a imagem da conta e extraia as seguintes informações:
- "empresa": Nome da empresa/beneficiário
- "vencimento": Data de vencimento (Formato YYYY-MM-DD)
- "valor": Valor da conta (number)
- "codigoBarras": Linha digitável ou Código de barras numérico (string, apenas os números)
- "codigoPix": Código de pagamento Pix (Pix Copia e Cola / Payload do QR Code)

RETORNE APENAS UM OBJETO JSON COM A SEGUINTE ESTRUTURA EXATA (sem markdown):
{
  "empresa": string | null,
  "vencimento": string | null,
  "valor": number | null,
  "codigoBarras": string | null,
  "codigoPix": string | null
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: [
          prompt,
          { inlineData: { data: imageBase64, mimeType: mimeType || 'image/jpeg' } }
        ]
      });

      const rawText = response.text || '';
      
      let parsedData;
      try {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      } catch (parseErr) {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Invalid JSON response from AI model");
        }
      }

      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.error("Process bill error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  function smartFallbackParse(text: string) {
    const lower = text.toLowerCase();
    let amount = 0;
    const moneyMatch = text.match(/(?:r\$)?\s*(\d+[\.,]?\d*)/i);
    if (moneyMatch) {
      const cleanNum = moneyMatch[1].replace(/\./g, '').replace(',', '.');
      amount = parseFloat(cleanNum) || 0;
    }

    let category = 'Outros';
    let scope = 'geral';
    let type = 'despesa';

    if (lower.includes('gasolina') || lower.includes('combustível') || lower.includes('abasteci') || lower.includes('posto')) {
      category = 'Combustível';
      scope = 'carro';
    } else if (lower.includes('óleo') || lower.includes('revisão') || lower.includes('pneu') || lower.includes('oficina') || lower.includes('carro')) {
      category = 'Manutenção Carro';
      scope = 'carro';
    } else if (lower.includes('supermercado') || lower.includes('mercado') || lower.includes('compras') || lower.includes('padaria')) {
      category = 'Supermercado';
      scope = 'casa';
    } else if (lower.includes('luz') || lower.includes('energia') || lower.includes('enel') || lower.includes('cpfl')) {
      category = 'Energia';
      scope = 'casa';
    } else if (lower.includes('água') || lower.includes('sabesp') || lower.includes('gas')) {
      category = 'Água/Gás';
      scope = 'casa';
    } else if (lower.includes('internet') || lower.includes('celular') || lower.includes('tv')) {
      category = 'Internet/TV';
      scope = 'geral';
    } else if (lower.includes('salário') || lower.includes('recebi') || lower.includes('pix de') || lower.includes('pagamento recebido')) {
      category = 'Salário/Renda';
      type = 'receita';
    } else if (lower.includes('aluguel') || lower.includes('condomínio')) {
      category = lower.includes('condomínio') ? 'Condomínio' : 'Moradia';
      scope = 'casa';
    }

    let paymentMethod = 'PIX';
    if (lower.includes('cartão') || lower.includes('credito') || lower.includes('crédito')) paymentMethod = 'Cartão de Crédito';
    else if (lower.includes('boleto')) paymentMethod = 'Boleto';
    else if (lower.includes('dinheiro')) paymentMethod = 'Dinheiro';
    else if (lower.includes('débito')) paymentMethod = 'Débito';

    return {
      targetModule: 'transactions',
      data: {
        description: text.slice(0, 50),
        amount: amount > 0 ? amount : 50.0,
        type,
        category,
        scope,
        date: new Date().toISOString().slice(0, 10),
        paymentMethod,
        notes: `Gerado via assistente IA inteligente (${text})`,
      },
    };
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
