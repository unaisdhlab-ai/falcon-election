@echo off
cd /d "%~dp0"
echo Starting Falcon Election local server...
echo.
echo The server will print local network URLs when it starts.
echo.
echo === To share with devices on OTHER Wi-Fi networks ===
echo Open a second Command Prompt in this folder and run:
echo.
echo   Option A (no install):  npx localtunnel --port 8094
echo   Option B (ngrok):       ngrok http 8094
echo.
echo Either will give you a public https:// URL you can share.
echo =====================================================
echo.
node server.js
pause
