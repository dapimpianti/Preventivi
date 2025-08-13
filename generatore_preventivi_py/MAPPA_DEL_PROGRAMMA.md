### Mappa del Programma: `generatore_preventivi_py`

Ho analizzato la struttura del codice e ho creato una mappa dettagliata del suo funzionamento.

#### 1. Panoramica Generale
L'applicazione è un'interfaccia grafica (GUI) costruita con Python e la libreria **CustomTkinter**. Il suo scopo è agire come un assistente AI per la creazione di preventivi, utilizzando un modello linguistico di Google (Gemini) per rispondere alle domande degli utenti basandosi su una "base di conoscenza" fornita sotto forma di file.

#### 2. Componenti Principali

*   **`main.py` (Punto di Avvio)**
    *   **Scopo:** È il file che avvia l'intera applicazione.
    *   **Logica:** La sua unica responsabilità è creare un'istanza della finestra principale (`AppUI`) e metterla in esecuzione.

*   **`config.py` (Configurazione)**
    *   **Scopo:** Gestire le chiavi segrete e le impostazioni.
    *   **Logica:** Utilizza `python-dotenv` per caricare la `GOOGLE_API_KEY` da un file `.env` nascosto. Questo permette di tenere le credenziali separate dal codice sorgente.

*   **`services/gemini_service.py` (Il Cervello AI)**
    *   **Scopo:** Gestire tutta la comunicazione con l'API di Google Gemini.
    *   **Logica:**
        1.  **Inizializzazione:** Si configura con la chiave API e seleziona il modello `gemini-1.5-flash`.
        2.  **Lettura File:** È in grado di estrarre testo da file PDF (con `pypdf`), TXT e CSV. Gestisce diverse codifiche di testo per evitare errori.
        3.  **Prompt Engineering:** Al primo messaggio di una conversazione, costruisce un "super-prompt" che include:
            *   Istruzioni dettagliate su come l'AI deve comportarsi (il suo ruolo, le regole, cosa fare se non sa la risposta).
            *   Il contenuto completo di tutti i file presenti nella `knowledge_store`.
            *   La domanda dell'utente.
        4.  **Memoria:** Per i messaggi successivi, sfrutta la cronologia della chat dell'API per mantenere il contesto, senza dover inviare di nuovo tutti i documenti.
        5.  **Reset:** Se i file nella knowledge base cambiano, la memoria della chat viene resettata per forzare l'AI a usare le nuove informazioni.

*   **`ui/` (Cartella dell'Interfaccia Utente)**
    *   **`app_ui.py` (La Finestra Principale)**
        *   **Scopo:** È il contenitore principale dell'applicazione.
        *   **Logica:** Crea e organizza i due pannelli (Knowledge e Chat). Fa da "regista", passando i messaggi dall'interfaccia al `GeminiService` e viceversa.
    *   **`knowledge_frame.py` (Pannello Sinistro - Knowledge Base)**
        *   **Scopo:** Permettere all'utente di gestire i file che l'AI userà come riferimento.
        *   **Logica:**
            *   Consente di caricare file dal computer.
            *   I file vengono salvati nella cartella `knowledge_store/` per essere riutilizzati tra una sessione e l'altra.
            *   Mostra l'elenco dei file caricati e permette di rimuoverli.
    *   **`chat_frame.py` (Pannello Destro - Chat)**
        *   **Scopo:** Fornire l'interfaccia di conversazione.
        *   **Logica:**
            *   Mostra lo storico della chat, formattando i messaggi di `User`, `AI` e `System` in modo diverso.
            *   Contiene la casella di testo per scrivere i messaggi e il pulsante "Invia".
            *   Si disabilita temporaneamente mentre l'AI sta "pensando" alla risposta.

#### 3. Flusso di Lavoro (Workflow)

1.  L'utente avvia l'applicazione eseguendo `main.py`.
2.  `AppUI` crea la finestra con i due pannelli.
3.  `KnowledgeFrame` carica i file già presenti nella cartella `knowledge_store/`.
4.  L'utente può aggiungere o rimuovere file dalla Knowledge Base.
5.  L'utente scrive un messaggio nella `ChatFrame` e preme "Invia".
6.  `AppUI` riceve il messaggio e i percorsi dei file dalla `KnowledgeFrame`.
7.  `AppUI` passa tutto al `GeminiService`.
8.  `GeminiService` legge il contenuto dei file (se è il primo messaggio), costruisce il prompt e lo invia all'API di Gemini.
9.  L'API restituisce una risposta.
10. `GeminiService` la passa ad `AppUI`, che a sua volta la invia alla `ChatFrame` per mostrarla all'utente.
