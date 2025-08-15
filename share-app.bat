@echo off
echo ========================================
echo    COMPARTIR APLICACION MEME-AI
echo ========================================
echo.
echo 1. Descarga ngrok desde: https://ngrok.com/download
echo 2. Extrae ngrok.exe a esta carpeta
echo 3. Registrate en ngrok y obten tu token
echo 4. Ejecuta: ngrok config add-authtoken TU_TOKEN
echo 5. Ejecuta este script nuevamente
echo.

if not exist "ngrok.exe" (
    echo ERROR: ngrok.exe no encontrado en esta carpeta
    echo Descargalo desde https://ngrok.com/download
    pause
    exit /b 1
)

echo Iniciando tuneles...
echo.
echo Frontend estara disponible en una URL publica
echo Backend estara disponible en otra URL publica
echo.

start "ngrok-frontend" ngrok http 5173
timeout /t 2 /nobreak > nul
start "ngrok-backend" ngrok http 8000

echo.
echo ========================================
echo URLs publicas generadas:
echo - Abre las ventanas de ngrok para ver las URLs
echo - Comparte la URL del frontend con tus companeros
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar los tuneles...
pause > nul

taskkill /f /im ngrok.exe > nul 2>&1
echo Tuneles cerrados.
