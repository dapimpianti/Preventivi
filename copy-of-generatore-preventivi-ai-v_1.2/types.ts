export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

export interface ChatMessage {
  sender: MessageSender;
  text: string;
  userPrompt?: string; // Prompt dell'utente che ha generato questa risposta del bot
}

export enum IndexingStatus {
  IDLE = 'idle',
  INDEXING = 'indexing',
  INDEXED = 'indexed',
  ERROR = 'error',
}

export interface StoredFile {
  name: string;
  content: string;
  isDefault?: boolean;
}
