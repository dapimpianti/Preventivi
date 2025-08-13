import customtkinter as ctk
from tkinter import filedialog
import os

class KnowledgeFrame(ctk.CTkFrame):
    def __init__(self, master, on_files_changed, **kwargs):
        super().__init__(master, **kwargs)
        self.uploaded_files = {}
        self.on_files_changed = on_files_changed

        self.grid_columnconfigure(0, weight=1)

        self.title_label = ctk.CTkLabel(self, text="Knowledge Base", font=ctk.CTkFont(size=16, weight="bold"))
        self.title_label.grid(row=0, column=0, padx=10, pady=(10, 5), sticky="w")

        self.upload_button = ctk.CTkButton(self, text="Carica File", command=self.upload_file)
        self.upload_button.grid(row=1, column=0, padx=10, pady=5, sticky="ew")

        self.files_frame = ctk.CTkScrollableFrame(self, label_text="File Caricati")
        self.files_frame.grid(row=2, column=0, padx=10, pady=(5, 10), sticky="nsew")
        self.grid_rowconfigure(2, weight=1)

    def upload_file(self):
        filepaths = filedialog.askopenfilenames(
            title="Seleziona i file",
            filetypes=(("Documenti", "*.txt *.pdf *.csv"), ("Tutti i file", "*.*"))
        )
        if not filepaths:
            return

        files_were_added = False
        for filepath in filepaths:
            filename = os.path.basename(filepath)
            if filename not in self.uploaded_files:
                files_were_added = True
                uploads_dir = "uploads"
                if not os.path.exists(uploads_dir):
                    os.makedirs(uploads_dir)
                
                destination_path = os.path.join(uploads_dir, filename)
                with open(filepath, 'rb') as f_in, open(destination_path, 'wb') as f_out:
                    f_out.write(f_in.read())

                self.add_file_to_list(filename, destination_path)
        
        if files_were_added:
            self.on_files_changed()

    def add_file_to_list(self, filename, filepath):
        file_entry_frame = ctk.CTkFrame(self.files_frame)
        file_entry_frame.pack(fill="x", pady=(2, 2), padx=5)

        label = ctk.CTkLabel(file_entry_frame, text=filename, anchor="w")
        label.pack(side="left", fill="x", expand=True, padx=5)

        delete_button = ctk.CTkButton(file_entry_frame, text="X", width=30, command=lambda f=filename: self.remove_file(f))
        delete_button.pack(side="right", padx=5)

        self.uploaded_files[filename] = {"widget": file_entry_frame, "path": filepath}

    def remove_file(self, filename):
        if filename in self.uploaded_files:
            self.uploaded_files[filename]["widget"].destroy()
            file_to_delete = self.uploaded_files[filename]["path"]
            if os.path.exists(file_to_delete):
                os.remove(file_to_delete)
            del self.uploaded_files[filename]
            self.on_files_changed()

    def get_knowledge_filepaths(self):
        return [info["path"] for info in self.uploaded_files.values()]