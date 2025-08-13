import google.generativeai as genai
from config import GOOGLE_API_KEY
import os
from pypdf import PdfReader

class GeminiService:
    def __init__(self):
        if not GOOGLE_API_KEY:
            raise ValueError("API key for Google not found. Please set the GOOGLE_API_KEY environment variable.")
        genai.configure(api_key=GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
        self.reset_chat_session() # Initialize chat

    def reset_chat_session(self):
        """Resets the chat history and context sent flag."""
        self.chat = self.model.start_chat(history=[])
        self.context_sent = False
        print("Chat session has been reset.")

    def _get_file_content(self, file_path):
        """
        Extracts text content from a file, trying different encodings for text files.
        """
        try:
            if file_path.endswith(".pdf"):
                reader = PdfReader(file_path)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() or ""
                return text
            else:  # Handles .txt, .csv, and other text-based files
                try:
                    # First, try to read with the standard UTF-8
                    with open(file_path, "r", encoding="utf-8") as f:
                        return f.read()
                except UnicodeDecodeError:
                    # If UTF-8 fails, try with latin-1, common for Windows-generated files
                    print(f"UTF-8 failed for {os.path.basename(file_path)}, trying latin-1 encoding.")
                    with open(file_path, "r", encoding="latin-1") as f:
                        return f.read()
        except Exception as e:
            print(f"Could not read file {file_path}: {e}")
            return ""

    def generate_response(self, user_prompt: str, knowledge_files: list[str]) -> str:
        """
        Generates a response from Gemini. Sends file context only on the first message
        of a session, then relies on the chat history.
        """
        prompt_to_send = user_prompt

        # If context has not been sent in this session, build the full prompt
        if not self.context_sent and knowledge_files:
            print("Sending initial context to Gemini...")
            full_context = "Basandoti sui seguenti documenti, rispondi alle domande dell'utente.\n\n--- CONTESTO DAI FILE ---"
            for file_path in knowledge_files:
                file_name = os.path.basename(file_path)
                content = self._get_file_content(file_path)
                if content:
                    full_context += f"\n--- Contenuto del file: {file_name} ---\n{content}\n"
            full_context += "\n--- FINE CONTESTO ---\n\n"
            prompt_to_send = f"{full_context}Domanda Utente: {user_prompt}"
            self.context_sent = True

        try:
            response = self.chat.send_message(prompt_to_send)
            return response.text
        except Exception as e:
            return f"Errore durante la comunicazione con l'API Gemini: {e}"