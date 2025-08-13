# Appunti di Sviluppo - Generatore Preventivi AI (Python)

Questo documento riassume le decisioni chiave e le modifiche apportate durante la conversione dell'applicazione React in Python, con l'obiettivo di fornire una traccia per future modifiche e debug.

---

## 1. Implementazione Iniziale (Conversione da React a Python)

*   **Data:** 13 agosto 2025
*   **Obiettivo:** Convertire l'applicazione React esistente in un'applicazione desktop Python con interfaccia moderna.
*   **Tecnologie Scelte:**
    *   **UI:** CustomTkinter (per interfaccia moderna e accattivante).
    *   **Backend AI:** `google-generativeai` (per API Gemini).
    *   **Gestione Dipendenze:** `venv` e `requirements.txt`.
    *   **Configurazione API Key:** `.env` (per sicurezza).
    *   **Struttura:** Modulare (`ui/`, `services/`, `config.py`).
*   **Funzionalità Iniziali:** Interfaccia chat, gestione knowledge base (caricamento file), comunicazione con Gemini.
*   **File Creati:** `main.py`, `config.py`, `services/gemini_service.py`, `ui/app_ui.py`, `ui/chat_frame.py`, `ui/knowledge_frame.py`, `.gitignore`, `requirements.txt`, `start.bat`.

---

## 2. Ottimizzazione Gestione Contesto e Conversazione

*   **Data:** 13 agosto 2025
*   **Problema Iniziale:** L'AI non manteneva il contesto tra i messaggi; ogni richiesta inviava l'intera knowledge base.
*   **Soluzione:**
    *   Implementata logica di "sessione" in `services/gemini_service.py`: la knowledge base viene inviata solo al primo messaggio di una nuova sessione.
    *   Aggiunta funzione `reset_chat_session()` per resettare la conversazione.
    *   `ui/knowledge_frame.py` ora notifica `ui/app_ui.py` (tramite callback `on_files_changed`) quando i file della knowledge base vengono aggiunti/rimossi.
    *   `ui/app_ui.py` chiama `gemini_service.reset_chat_session()` e mostra un messaggio di sistema all'utente in caso di modifiche alla knowledge base.
*   **Benefici:** Maggiore efficienza (meno dati inviati a Gemini), migliore fluidità della conversazione.

---

## 3. Risoluzione Problemi di Codifica File (.csv)

*   **Data:** 13 agosto 2025
*   **Problema:** Errore `UnicodeDecodeError` durante la lettura di file `.csv` (es. `magazzinoAccess (1).csv`) a causa di codifica non-UTF-8.
*   **Soluzione:** Modificata la funzione `_get_file_content` in `services/gemini_service.py` per tentare la lettura con `latin-1` se `utf-8` fallisce.
*   **Benefici:** Maggiore robustezza nella lettura di file con diverse codifiche, prevenzione crash.

---

## 4. Ottimizzazione Risposte AI (Prompt e Parametri Modello)

*   **Data:** 13 agosto 2025
*   **Problema:** Risposte AI insoddisfacenti ("non ho abbastanza informazioni") anche con knowledge base pertinente.
*   **Analisi:**
    *   **Prompt:** La Regola 4 era troppo stringente, impedendo all'AI di fornire risposte correlate o chiedere chiarimenti.
    *   **Parametri Modello:** `temperature` predefinita troppo bassa per il comportamento desiderato.
*   **Soluzione:**
    *   **Modifica Prompt (`services/gemini_service.py`):** Riformulata la Regola 4 per incoraggiare l'AI a fornire informazioni correlate e a chiedere dettagli se la domanda non è una corrispondenza esatta.
    *   **Parametri Modello (`services/gemini_service.py`):**
        *   `temperature` impostata a `0.8` (per maggiore creatività e proattività).
        *   `max_output_tokens` impostato a `2048` (per risposte più lunghe e dettagliate).
    *   **Formattazione Knowledge Base:** Rimosse le etichette interne (`--- Contenuto dal file: ... ---`) dal blocco `knowledge_base_content` per evitare confusione del modello.
*   **Benefici:** Risposte AI più utili, proattive e simili al comportamento dell'app precedente.

---

## 5. Appunti per il Futuro

*   **Modello Linguistico:** L'utente ha riscontrato un miglioramento significativo cambiando manualmente il modello a "Gemini 2.5" (probabilmente `gemini-1.5-flash-latest` o una versione più recente/performante). Verificare se il modello specificato nel codice (`gemini-1.5-flash-latest`) è quello che l'utente intendeva o se c'è un modello più recente/performante da considerare.
*   **Parametri `top_p` e `top_k`:** Attualmente non impostati esplicitamente (usano i default). L'utente ha menzionato di aver usato `top_p: 0.9` e `top_k: 40` nella vecchia app per risposte "molto coerenti e fattuali". Se le risposte attuali dovessero risultare troppo "creative" o meno precise, si potrebbe sperimentare l'aggiunta di questi parametri con i valori suggeriti dall'utente.
*   **Gestione Errori UI:** Migliorare la gestione degli errori nell'interfaccia utente per feedback più chiari all'utente (es. se l'API key non è valida).
*   **Funzionalità Aggiuntive:** Considerare l'implementazione di funzionalità come la persistenza della knowledge base tra le sessioni (salvataggio/caricamento dell'elenco dei file caricati).
