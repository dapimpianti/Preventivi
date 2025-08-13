import { GoogleGenAI, Chat, Type } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY non trovata. Assicurati che la variabile d'ambiente process.env.API_KEY sia impostata.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const createChatSession = (knowledgeBaseContent: string): Chat => {
  const systemInstruction = `Sei un assistente virtuale specializzato nella creazione di preventivi per un'azienda che realizza impianti elettrotermoidraulici.
Il tuo compito è rispondere alle domande del cliente e formulare preventivi basandoti ESCLUSIVAMENTE sulla documentazione fornita.
La documentazione è composta da file di testo con descrizioni dei servizi e file CSV con listini prezzi.

REGOLE IMPORTANTI:
1.  Fornisci risposte dettagliate e precise.
2.  Quando crei un preventivo, elenca chiaramente le voci che comprendano i dettagli, i prezzi singoli e il totale. Usa un formato leggibile e ben organizzato.
3.  Se ti viene chiesto uno sconto, applica solo quelli menzionati nella documentazione (es. pagamento anticipato).
4.  Se una domanda riguarda un prodotto, un servizio o un'informazione NON PRESENTE nella documentazione, DEVI rispondere con: "Mi dispiace, ma non ho abbastanza informazioni nella mia base di conoscenza per rispondere a questa domanda."
5.  Non inventare mai informazioni, prezzi o servizi. Attieniti strettamente ai dati forniti.

Ecco la base di conoscenza che devi usare:
--- INIZIO DOCUMENTAZIONE ---
${knowledgeBaseContent}
--- FINE DOCUMENTAZIONE ---
`;

  const chat = ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.2, // Bassa temperatura per risposte più deterministiche e fattuali
      topP: 0.9,
      topK: 40,
    },
  });

  return chat;
};

export const sendMessage = async (chat: Chat, message: string): Promise<string> => {
  try {
    const result: GenerateContentResponse = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Errore API Gemini:", error);
    throw new Error("Impossibile ottenere una risposta dal servizio AI.");
  }
};

const quoteSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      description: "Elenco delle voci del preventivo.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Descrizione della voce (prodotto o servizio)." },
          quantity: { type: Type.NUMBER, description: "Quantità." },
          unit_price: { type: Type.NUMBER, description: "Prezzo unitario." },
          total: { type: Type.NUMBER, description: "Prezzo totale per la voce (quantità * prezzo unitario)." }
        },
        required: ["description", "quantity", "unit_price", "total"]
      }
    },
    subtotal: { type: Type.NUMBER, description: "Il subtotale di tutte le voci prima di sconti o tasse." },
    discount: {
        type: Type.OBJECT,
        description: "Eventuale sconto applicato.",
        properties: {
            description: { type: Type.STRING, description: "Descrizione dello sconto." },
            amount: { type: Type.NUMBER, description: "Ammontare dello sconto (valore negativo)." }
        }
    },
    total: { type: Type.NUMBER, description: "Il costo finale comprensivo di tutto." }
  },
  required: ["items", "subtotal", "total"]
};

export const generateStructuredQuote = async (userPrompt: string, knowledgeBaseContent: string): Promise<string> => {
    const systemInstruction = `Sei un esperto contabile. Il tuo unico scopo è generare un preventivo in formato JSON basato sulla richiesta dell'utente e sulla documentazione fornita. Devi attenerti rigorosamente allo schema JSON.
--- INIZIO DOCUMENTAZIONE ---
${knowledgeBaseContent}
--- FINE DOCUMENTAZIONE ---
`;
    
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: userPrompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: quoteSchema,
            temperature: 0.1,
        }
    });

    const jsonText = response.text;
    const quoteData = JSON.parse(jsonText);

    // Converti JSON in CSV usando il punto e virgola come separatore.
    // I numeri in JS usano il punto come separatore decimale di default.
    let csvContent = "Descrizione;Quantità;Prezzo Unitario;Totale\n";
    
    quoteData.items.forEach((item: any) => {
        // Gestisce le virgolette nel campo descrizione per evitare di rompere il CSV
        const description = item.description ? `"${item.description.replace(/"/g, '""')}"` : '""';
        const row = [
            description,
            item.quantity,
            item.unit_price,
            item.total
        ];
        csvContent += row.join(';') + '\n';
    });

    csvContent += "\n"; // Riga vuota per separazione
    
    // Allinea i totali nell'ultima colonna per coerenza
    csvContent += `Subtotale;;;${quoteData.subtotal}\n`;
    if (quoteData.discount && quoteData.discount.amount) {
         const discountDescription = quoteData.discount.description ? `"${quoteData.discount.description.replace(/"/g, '""')}"` : '"Sconto"';
         csvContent += `${discountDescription};;;${quoteData.discount.amount}\n`;
    }
    csvContent += `TOTALE;;;${quoteData.total}\n`;
    
    return csvContent;
};

export const generateExpandedQuote = async (quoteText: string): Promise<string> => {
    const systemInstruction = `Sei un consulente commerciale esperto. Il tuo compito è prendere un preventivo tecnico e trasformarlo in un documento di testo formale e descrittivo per un cliente.
Espandi la descrizione delle lavorazioni in modo professionale e dettagliato. Elenca le voci principali in modo chiaro e concludi con il prezzo totale.
Sii cortese e professionale.`;

    const userMessage = `Ecco il preventivo da elaborare:\n\n---\n${quoteText}\n---`;

    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: userMessage,
        config: {
            systemInstruction,
            temperature: 0.5,
        }
    });

    return response.text;
};