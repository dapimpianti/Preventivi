import customtkinter as ctk
from .knowledge_frame import KnowledgeFrame
from .chat_frame import ChatFrame
from services.gemini_service import GeminiService

class AppUI(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("Generatore Preventivi AI")
        self.geometry("1100x720")
        ctk.set_appearance_mode("System")
        ctk.set_default_color_theme("blue")

        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # --- Pannello Sinistro (Knowledge Base) ---
        self.knowledge_frame = KnowledgeFrame(self, on_files_changed=self.handle_files_changed, width=300)
        self.knowledge_frame.grid(row=0, column=0, padx=(10, 5), pady=10, sticky="nsew")

        # --- Pannello Destro (Chat) ---
        self.chat_frame = ChatFrame(self, on_send_message=self.handle_send_message)
        self.chat_frame.grid(row=0, column=1, padx=(5, 10), pady=10, sticky="nsew")

        # --- Servizio AI ---
        try:
            self.gemini_service = GeminiService()
        except ValueError as e:
            self.chat_frame.add_message("System", str(e))
            self.chat_frame.set_thinking_state(True) # Disable input

    def handle_files_changed(self):
        """Called when files are added or removed from the knowledge base."""
        if hasattr(self, 'gemini_service'):
            self.gemini_service.reset_chat_session()
            self.chat_frame.add_message("System", "La knowledge base è stata modificata. La conversazione è stata resettata per riflettere i cambiamenti.")

    def handle_send_message(self, user_message: str):
        if not hasattr(self, 'gemini_service'):
            return
            
        self.chat_frame.set_thinking_state(True)
        knowledge_files = self.knowledge_frame.get_knowledge_filepaths()
        
        # Run API call in a separate thread to avoid freezing the UI
        self.after(100, self.run_gemini_call, user_message, knowledge_files)

    def run_gemini_call(self, user_message, knowledge_files):
        response = self.gemini_service.generate_response(user_message, knowledge_files)
        self.chat_frame.add_message("AI", response)
        self.chat_frame.set_thinking_state(False)

    def run(self):
        self.mainloop()