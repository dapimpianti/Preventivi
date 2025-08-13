@echo off
ECHO Attivazione dell'ambiente virtuale e avvio dell'applicazione...

REM Attiva l'ambiente virtuale
CALL venv\Scripts\activate.bat

REM Avvia l'applicazione Python
ECHO Avvio di main.py...
python main.py

ECHO Applicazione chiusa.
pause
