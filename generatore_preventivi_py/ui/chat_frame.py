import customtkinter as ctk

class ChatFrame(ctk.CTkFrame):
    def __init__(self, master, on_send_message, **kwargs):
        super().__init__(master, **kwargs)
        self.on_send_message = on_send_message

        self.grid_rowconfigure(0, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self.textbox = ctk.CTkTextbox(self, state="normal", font=ctk.CTkFont(size=14), wrap="word")
        self.textbox.grid(row=0, column=0, columnspan=2, padx=10, pady=10, sticky="nsew")

        # Enable copy functionality
        self.textbox.bind("<Control-c>", lambda e: self.textbox.event_generate("<<Copy>>"))
        self.textbox.bind("<Control-C>", lambda e: self.textbox.event_generate("<<Copy>>")) # For consistency
        
        # Make text selectable with mouse
        self.textbox.configure(state="disabled")
        self.textbox.configure(cursor="arrow")
        self.textbox.bind("<Button-1>", lambda e: self.enable_text_selection())
        self.textbox.bind("<ButtonRelease-1>", lambda e: self.disable_text_editing())

        # Define tags for message styling
        self.textbox.tag_config("user_sender", foreground="#1E90FF") # DodgerBlue
        self.textbox.tag_config("ai_sender", foreground="#32CD32") # LimeGreen
        self.textbox.tag_config("system_sender", foreground="#FFA500") # Orange

        self.textbox.tag_config("user_message", background="#E0E0E0", foreground="#333333", lmargin1=5, lmargin2=5, rmargin=5, spacing1=5, spacing3=5) # Light Gray background for user
        self.textbox.tag_config("ai_message", background="#D0F0C0", foreground="#333333", lmargin1=5, lmargin2=5, rmargin=5, spacing1=5, spacing3=5) # Light Green background for AI
        self.textbox.tag_config("system_message", background="#FFFACD", foreground="#333333", lmargin1=5, lmargin2=5, rmargin=5, spacing1=5, spacing3=5) # LemonChiffon for system

        self.entry = ctk.CTkEntry(self, placeholder_text="Scrivi il tuo messaggio...", font=ctk.CTkFont(size=14))
        self.entry.grid(row=1, column=0, padx=(10, 5), pady=(0, 10), sticky="ew")
        self.entry.bind("<Return>", self.send_message_event)

        self.send_button = ctk.CTkButton(self, text="Invia", command=self.send_message_event, width=80)
        self.send_button.grid(row=1, column=1, padx=(5, 10), pady=(0, 10), sticky="e")

    def send_message_event(self, event=None):
        message = self.entry.get()
        if message.strip():
            self.add_message("User", message)
            self.entry.delete(0, "end")
            self.on_send_message(message)

    def add_message(self, sender: str, message: str):
        self.textbox.configure(state="normal")
        
        sender_tag = ""
        message_tag = ""
        if sender == "User":
            sender_tag = "user_sender"
            message_tag = "user_message"
        elif sender == "AI":
            sender_tag = "ai_sender"
            message_tag = "ai_message"
        elif sender == "System": # Added for system messages
            sender_tag = "system_sender"
            message_tag = "system_message"

        self.textbox.insert("end", f"{sender}:\n", sender_tag)
        self.textbox.insert("end", f"{message}\n\n", message_tag)
        
        # Disable editing after inserting text but allow selection
        self.textbox.configure(state="disabled")
        self.textbox.see("end")

    def set_thinking_state(self, thinking: bool):
        if thinking:
            self.entry.configure(state="disabled")
            self.send_button.configure(state="disabled", text="...")
        else:
            self.entry.configure(state="normal")
            self.send_button.configure(state="normal", text="Invia")
            
    def enable_text_selection(self):
        """Temporarily enable text selection"""
        self.textbox.configure(state="normal")
        
    def disable_text_editing(self):
        """Disable editing while keeping selection capability"""
        # Get current selection if any
        try:
            selected_text = self.textbox.get("sel.first", "sel.last")
            has_selection = True
        except:
            has_selection = False
            
        # Disable editing but keep the selection if there was one
        self.textbox.configure(state="disabled")
        
        # If text was selected, copy it to clipboard
        if has_selection:
            self.textbox.clipboard_clear()
            self.textbox.clipboard_append(selected_text)