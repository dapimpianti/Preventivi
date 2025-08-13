import customtkinter as ctk
from tkinter import filedialog
import os
import shutil

class KnowledgeFrame(ctk.CTkFrame):
    def __init__(self, master, on_files_changed, **kwargs):
        super().__init__(master, **kwargs)
        self.uploaded_files = {}
        self.on_files_changed = on_files_changed
        
        # Define the persistent knowledge store directory
        self.knowledge_store_path = "knowledge_store"
        os.makedirs(self.knowledge_store_path, exist_ok=True)

        self.grid_columnconfigure(0, weight=1)

        self.title_label = ctk.CTkLabel(self, text="Knowledge Base", font=ctk.CTkFont(size=16, weight="bold"))
        self.title_label.grid(row=0, column=0, padx=10, pady=(10, 5), sticky="w")

        self.upload_button = ctk.CTkButton(self, text="Carica File", command=self.upload_file)
        self.upload_button.grid(row=1, column=0, padx=10, pady=5, sticky="ew")

        self.files_frame = ctk.CTkScrollableFrame(self, label_text="File Caricati")
        self.files_frame.grid(row=2, column=0, padx=10, pady=(5, 10), sticky="nsew")
        self.grid_rowconfigure(2, weight=1)
        
        self._load_persisted_files()

    def _load_persisted_files(self):
        """Loads files from the knowledge_store into the UI on startup."""
        print(f"Checking for existing files in {self.knowledge_store_path}...")
        found_files = False
        for filename in os.listdir(self.knowledge_store_path):
            if filename.startswith('.'): # ignore hidden files like .DS_Store
                continue
            
            full_path = os.path.join(self.knowledge_store_path, filename)
            if os.path.isfile(full_path):
                print(f"Loading persisted file: {filename}")
                self.add_file_to_list(filename, full_path)
                found_files = True
        
        if found_files:
            # Notify the main app that files have been loaded
            self.on_files_changed()

    def upload_file(self):
        filepaths = filedialog.askopenfilenames(
            title="Seleziona i file",
            filetypes=(("Documenti", "*.txt *.pdf *.csv"), ("Tutti i file", "*.*"))
        )
        if not filepaths:
            return

        files_were_added = False
        for source_path in filepaths:
            filename = os.path.basename(source_path)
            if filename not in self.uploaded_files:
                destination_path = os.path.join(self.knowledge_store_path, filename)
                
                # Copy file to the knowledge store
                shutil.copy2(source_path, destination_path)
                
                self.add_file_to_list(filename, destination_path)
                files_were_added = True
        
        if files_were_added:
            self.on_files_changed()

    def add_file_to_list(self, filename, filepath):
        # Avoid adding duplicates if already present
        if filename in self.uploaded_files:
            return
            
        file_entry_frame = ctk.CTkFrame(self.files_frame)
        file_entry_frame.pack(fill="x", pady=(2, 2), padx=5)

        label = ctk.CTkLabel(file_entry_frame, text=filename, anchor="w")
        label.pack(side="left", fill="x", expand=True, padx=5)

        delete_button = ctk.CTkButton(file_entry_frame, text="X", width=30, command=lambda f=filename: self.remove_file(f))
        delete_button.pack(side="right", padx=5)

        self.uploaded_files[filename] = {"widget": file_entry_frame, "path": filepath}

    def remove_file(self, filename):
        if filename in self.uploaded_files:
            # 1. Remove from UI
            self.uploaded_files[filename]["widget"].destroy()
            
            # 2. Delete from filesystem
            file_to_delete = self.uploaded_files[filename]["path"]
            if os.path.exists(file_to_delete):
                try:
                    os.remove(file_to_delete)
                    print(f"Deleted {filename} from knowledge store.")
                except OSError as e:
                    print(f"Error deleting file {file_to_delete}: {e}")

            # 3. Remove from internal state
            del self.uploaded_files[filename]
            
            # 4. Notify main app
            self.on_files_changed()

    def get_knowledge_filepaths(self):
        return [info["path"] for info in self.uploaded_files.values()]