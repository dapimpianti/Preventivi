import google.generativeai as genai
from config import GOOGLE_API_KEY
import os
from pypdf import PdfReader

class GeminiService:
    def __init__(self):
        if not GOOGLE_API_KEY:
            raise ValueError("API key for Google not found. Please set the GOOGLE_API_KEY environment variable.")
        genai.configure(api_key=GOOGLE_API_KEY)
        self.model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config={
                "temperature": 0.8, # Increased for more helpful, less strict responses
                "max_output_tokens": 2048 # Ensure sufficient length for detailed answers
            }
        )
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
            
            # 1. Define the main prompt template provided by the user
            system_prompt_template = '''Sei un assistente virtuale specializzato nella creazione di preventivi per un'azienda che realizza impianti elettrotermoidraulici.
Il tuo compito è rispondere alle domande del cliente e formulare preventivi basandoti ESCLUSIVAMENTE sulla documentazione fornita.
La documentazione è composta da file di testo con descrizioni dei servizi e file CSV con listini prezzi.

REGOLE IMPORTANTI:
1. Fornisci risposte dettagliate e precise.
2. Quando crei un preventivo, elenca chiaramente le voci che comprendano i dettagli, i prezzi singoli e il totale. Usa un formato leggibile e ben organizzato.
3. Se ti viene chiesto uno sconto, applica solo quelli menzionati nella documentazione (es. pagamento anticipato).
4. Se una domanda riguarda un prodotto, un servizio o un'informazione NON PRESENTE direttamente nella documentazione, ma puoi fornire informazioni correlate o opzioni disponibili dalla documentazione per aiutare l'utente a specificare la sua richiesta, fallo. Altrimenti, rispondi con: "Mi dispiace, ma non ho abbastanza informazioni nella mia base di conoscenza per rispondere a questa domanda."
5. Non inventare mai informazioni, prezzi o servizi. Attieniti strettamente ai dati forniti.

Ecco la base di conoscenza che devi usare:
--- INIZIO DOCUMENTAZIONE ---
{knowledge_base_content}
--- FINE DOCUMENTAZIONE ---
'''

            # 2. Consolidate all knowledge base file contents
            knowledge_base_content = ""
            for file_path in knowledge_files:
                content = self._get_file_content(file_path)
                if content:
                    # Just concatenate content, separated by newlines, no internal headers
                    knowledge_base_content += f"{content}\n\n"

            # 3. Inject the content into the template
            final_prompt_with_context = system_prompt_template.format(knowledge_base_content=knowledge_base_content)

            # 4. Append the final user question
            prompt_to_send = f"{final_prompt_with_context}\n\nCLIENTE: {user_prompt}"
            self.context_sent = True

        try:
            response = self.chat.send_message(prompt_to_send)
            return response.text
        except Exception as e:
            return f"Errore durante la comunicazione con l'API Gemini: {e}"