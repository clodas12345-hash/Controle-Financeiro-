import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt + "\nImagem: [Descrição de teste: Topo BYD 162511 km Trip A 2.1km 99% bateria | Esquerda 99 R$ 236,60 6 solicitações | Direita Uber R$ 925,06 41 viagens]"
    });
    console.log("Success:\n", response.text);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
run();
