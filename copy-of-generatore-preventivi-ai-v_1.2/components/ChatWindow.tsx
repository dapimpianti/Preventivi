import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { MessageSender } from '../types';
import { BotIcon } from './icons/BotIcon';
import { UserIcon } from './icons/UserIcon';
import { SendIcon } from './icons/SendIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';
import { SpreadsheetIcon } from './icons/SpreadsheetIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';


interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isSending: boolean;
  isEnabled: boolean;
  onExportCsv: (userPrompt: string) => Promise<void>;
  onExportTxt: (quoteText: string) => Promise<void>;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  onSendMessage,
  isSending,
  isEnabled,
  onExportCsv,
  onExportTxt,
}) => {
  const [inputText, setInputText] = useState('');
  const [exportingState, setExportingState] = useState<{ [key: string]: 'csv' | 'txt' | null }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isSending && isEnabled) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const handleExport = async (type: 'csv' | 'txt', message: ChatMessage, index: number) => {
    const exportKey = `${index}-${type}`;
    setExportingState(prev => ({ ...prev, [exportKey]: type }));
    try {
      if (type === 'csv' && message.userPrompt) {
        await onExportCsv(message.userPrompt);
      } else if (type === 'txt') {
        await onExportTxt(message.text);
      }
    } finally {
      setExportingState(prev => ({ ...prev, [exportKey]: null }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 max-w-xl group ${
                msg.sender === MessageSender.USER ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.sender === MessageSender.USER ? 'bg-teal-500' : 'bg-slate-700'
                }`}
              >
                {msg.sender === MessageSender.BOT ? (
                  <BotIcon className="w-5 h-5 text-cyan-300" />
                ) : (
                  <UserIcon className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`px-4 py-3 rounded-lg relative ${
                  msg.sender === MessageSender.USER
                    ? 'bg-teal-600/80 text-white rounded-br-none'
                    : 'bg-slate-700/80 text-slate-200 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                {msg.sender === MessageSender.BOT && msg.userPrompt && (
                    <div className="absolute -bottom-4 right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        title="Esporta come Foglio di Calcolo (CSV)"
                        onClick={() => handleExport('csv', msg, index)}
                        disabled={!!exportingState[`${index}-csv`]}
                        className="p-1.5 bg-slate-600/80 hover:bg-slate-500/80 rounded-full text-slate-300 hover:text-white transition-colors"
                      >
                        {exportingState[`${index}-csv`] ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <SpreadsheetIcon className="w-4 h-4" />}
                      </button>
                       <button
                        title="Esporta come Documento (TXT)"
                        onClick={() => handleExport('txt', msg, index)}
                        disabled={!!exportingState[`${index}-txt`]}
                        className="p-1.5 bg-slate-600/80 hover:bg-slate-500/80 rounded-full text-slate-300 hover:text-white transition-colors"
                      >
                        {exportingState[`${index}-txt`] ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <DocumentIcon className="w-4 h-4" />}
                      </button>
                    </div>
                )}
              </div>
            </div>
          ))}
          {isSending && (
             <div className="flex items-start gap-3 max-w-xl mr-auto">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-700">
                    <BotIcon className="w-5 h-5 text-cyan-300" />
                </div>
                 <div className="px-4 py-3 rounded-lg bg-slate-700/80 text-slate-200 rounded-bl-none">
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-0"></span>
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></span>
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></span>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {!isEnabled && messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                <PaperclipIcon className="w-16 h-16 mb-4"/>
                <h3 className="text-lg font-semibold text-slate-400">La chat è disabilitata</h3>
                <p>Indicizza la base di conoscenza per iniziare.</p>
            </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-700/50 bg-slate-800/60">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isEnabled ? "Scrivi la tua richiesta..." : "Indicizza la base di conoscenza per iniziare"}
            disabled={!isEnabled || isSending}
            className="flex-1 w-full bg-slate-700 border-slate-600 text-slate-200 rounded-full py-2 px-4 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!isEnabled || isSending || !inputText.trim()}
            className="flex-shrink-0 w-10 h-10 bg-cyan-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};