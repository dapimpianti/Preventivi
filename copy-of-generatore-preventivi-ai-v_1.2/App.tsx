import React, { useState, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { KnowledgeBaseManager } from './components/KnowledgeBaseManager';
import { ChatWindow } from './components/ChatWindow';
import { createChatSession, sendMessage as sendChatMessage, generateStructuredQuote, generateExpandedQuote } from './services/geminiService';
import { IndexingStatus, type ChatMessage, MessageSender, type StoredFile } from './types';
import { BotIcon } from './components/icons/BotIcon';
import { PanelToggleIcon } from './components/icons/PanelToggleIcon';

// Mock file data
const MOCK_DOCS_CONTENT = `Documentazione Servizi
- Il nostro servizio standard include installazione e configurazione base del software.
- Il costo orario per servizi extra non inclusi nel pacchetto è di 50 EUR.
- L'assistenza premium offre supporto prioritario 24/7 a un costo fisso di 200 EUR al mese.
- Per lo sviluppo custom, il costo orario è specificato nel listino prezzi.
- Lo sconto per pagamento anticipato annuale è del 10% sul totale.`;

const MOCK_PRICELIST_CONTENT = `Prodotto,Prezzo,Unita
Licenza Software Base,1500,annuale
Licenza Software Pro,3000,annuale
Ore Sviluppo Custom,80,ora
Supporto Email,50,mensile`;

const SAVED_KB_KEY = 'savedKnowledgeBase';

const initialKnowledgeFiles: StoredFile[] = [
  { name: 'documentazione_servizi.txt', content: MOCK_DOCS_CONTENT, isDefault: true },
  { name: 'listino_prezzi.csv', content: MOCK_PRICELIST_CONTENT, isDefault: true },
];

const App: React.FC = () => {
  const [knowledgeFiles, setKnowledgeFiles] = useState<StoredFile[]>([]);
  const [indexingStatus, setIndexingStatus] = useState<IndexingStatus>(IndexingStatus.IDLE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isKbPanelOpen, setIsKbPanelOpen] = useState(true);

  useEffect(() => {
    const savedFilesString = localStorage.getItem(SAVED_KB_KEY);
    if (savedFilesString) {
      try {
        const savedFiles: StoredFile[] = JSON.parse(savedFilesString);
        if (Array.isArray(savedFiles)) {
          setKnowledgeFiles(savedFiles);
          // If files were saved, we assume they were indexed
          if (savedFiles.length > 0) {
            setIndexingStatus(IndexingStatus.INDEXING);
            const knowledgeBase = savedFiles
              .map(file => `File: ${file.name}\n---\n${file.content}\n---\n`)
              .join('\n');
            const session = createChatSession(knowledgeBase);
            setChatSession(session);
            setIndexingStatus(IndexingStatus.INDEXED);
            setMessages([
              {
                sender: MessageSender.BOT,
                text: "Base di conoscenza caricata dalla memoria. Sono pronto a creare un preventivo.",
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Errore nel caricamento della base di conoscenza:", error);
        setKnowledgeFiles(initialKnowledgeFiles);
        localStorage.removeItem(SAVED_KB_KEY);
      }
    } else {
      setKnowledgeFiles(initialKnowledgeFiles);
    }
  }, []);

  const handleFilesChange = async (newFiles: FileList | null) => {
    if (newFiles) {
       const newStoredFiles: StoredFile[] = [];
        for (const file of Array.from(newFiles)) {
            try {
                const content = await readFileContent(file);
                newStoredFiles.push({ name: file.name, content, isDefault: false });
            } catch (error) {
                console.error(`Errore durante la lettura del file ${file.name}:`, error);
            }
        }
      setKnowledgeFiles(prevFiles => {
        const existingNames = new Set(prevFiles.map(f => f.name));
        const uniqueNewFiles = newStoredFiles.filter(f => !existingNames.has(f.name));
        return [...prevFiles, ...uniqueNewFiles];
      });
      setIndexingStatus(IndexingStatus.IDLE);
      setChatSession(null);
      setMessages([]);
    }
  };
  
  const handleRemoveFile = (fileNameToRemove: string) => {
    setKnowledgeFiles(prevFiles => prevFiles.filter(f => f.name !== fileNameToRemove));
    setIndexingStatus(IndexingStatus.IDLE);
    setChatSession(null);
    setMessages([]);
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };

  const handleIndexKnowledgeBase = useCallback(async () => {
    if (knowledgeFiles.length === 0) return;
    
    setIndexingStatus(IndexingStatus.INDEXING);
    setMessages([]);
    
    try {
      const knowledgeBase = knowledgeFiles
        .map(file => `File: ${file.name}\n---\n${file.content}\n---\n`)
        .join('\n');
      
      const session = createChatSession(knowledgeBase);
      setChatSession(session);
      setIndexingStatus(IndexingStatus.INDEXED);
      setMessages([
        {
          sender: MessageSender.BOT,
          text: "Base di conoscenza indicizzata con successo. Sono pronto a creare un preventivo. Cosa desideri?",
        },
      ]);
      localStorage.setItem(SAVED_KB_KEY, JSON.stringify(knowledgeFiles));

    } catch (error) {
      console.error("Errore durante l'indicizzazione:", error);
      setIndexingStatus(IndexingStatus.ERROR);
      setMessages([
        {
          sender: MessageSender.BOT,
          text: "Si è verificato un errore durante la creazione della base di conoscenza. Controlla la console per i dettagli.",
        },
      ]);
    }
  }, [knowledgeFiles]);

  const handleClearKnowledgeBase = () => {
    localStorage.removeItem(SAVED_KB_KEY);
    setKnowledgeFiles(initialKnowledgeFiles);
    setIndexingStatus(IndexingStatus.IDLE);
    setMessages([]);
    setChatSession(null);
  };

  const handleSendMessage = async (messageText: string) => {
    if (!chatSession || !messageText.trim()) return;

    const newUserMessage: ChatMessage = { sender: MessageSender.USER, text: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    setIsSendingMessage(true);

    try {
      const botResponseText = await sendChatMessage(chatSession, messageText);
      const newBotMessage: ChatMessage = { sender: MessageSender.BOT, text: botResponseText, userPrompt: messageText };
      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error("Errore nell'invio del messaggio:", error);
      const errorMessage: ChatMessage = {
        sender: MessageSender.BOT,
        text: "Spiacente, si è verificato un errore durante la comunicazione con l'AI. Riprova.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: mimeType});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  const handleExportCsv = async (userPrompt: string) => {
    if (!userPrompt) return;
    try {
      const knowledgeBase = knowledgeFiles.map(file => `File: ${file.name}\n---\n${file.content}\n---\n`).join('\n');
      const csvContent = await generateStructuredQuote(userPrompt, knowledgeBase);
      triggerDownload('preventivo.csv', csvContent, 'text/csv;charset=utf-8;');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Impossibile esportare il preventivo come CSV. Controlla la console per i dettagli.');
    }
  };

  const handleExportTxt = async (quoteText: string) => {
     if (!quoteText) return;
    try {
      const textContent = await generateExpandedQuote(quoteText);
      triggerDownload('proposta_preventivo.txt', textContent, 'text/plain;charset=utf-8;');
    } catch (error) {
      console.error('Error exporting TXT:', error);
      alert('Impossibile esportare il preventivo come documento di testo. Controlla la console per i dettagli.');
    }
  };


  return (
    <div className="flex flex-col h-screen font-sans">
      <header className="bg-slate-900/70 backdrop-blur-sm border-b border-slate-700/50 p-4 shadow-lg z-10">
        <div className="container mx-auto flex items-center gap-4">
          <BotIcon className="w-8 h-8 text-cyan-400" />
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Generatore Preventivi AI
          </h1>
          <div className="flex-grow" />
            <button
                onClick={() => setIsKbPanelOpen(p => !p)}
                className="p-1.5 rounded-md hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label={isKbPanelOpen ? "Nascondi pannello conoscenza" : "Mostra pannello conoscenza"}
            >
                <PanelToggleIcon isOpen={isKbPanelOpen} className="w-6 h-6 text-slate-300" />
            </button>
        </div>
      </header>
      <main className={`flex-1 container mx-auto p-4 grid grid-cols-1 ${isKbPanelOpen ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6 overflow-hidden`}>
        <div className={`
          ${isKbPanelOpen ? 'flex' : 'hidden'} 
          lg:flex lg:col-span-1 flex-col h-full overflow-y-auto bg-slate-800/50 rounded-lg p-6 border border-slate-700/50`
        }>
          <KnowledgeBaseManager
            knowledgeFiles={knowledgeFiles}
            onFilesChange={handleFilesChange}
            onRemoveFile={handleRemoveFile}
            onIndex={handleIndexKnowledgeBase}
            onClear={handleClearKnowledgeBase}
            indexingStatus={indexingStatus}
          />
        </div>
        <div className={`
          ${isKbPanelOpen ? 'hidden lg:flex' : 'flex'} 
          ${isKbPanelOpen ? 'lg:col-span-2' : 'lg:col-span-1'} 
          flex-col h-full bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden`
        }>
          <ChatWindow
            messages={messages}
            onSendMessage={handleSendMessage}
            isSending={isSendingMessage}
            isEnabled={indexingStatus === IndexingStatus.INDEXED}
            onExportCsv={handleExportCsv}
            onExportTxt={handleExportTxt}
          />
        </div>
      </main>
    </div>
  );
};

export default App;