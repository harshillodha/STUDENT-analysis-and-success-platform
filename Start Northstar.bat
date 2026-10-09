@echo off
setlocal
cd /d "%~dp0"
set "PYTHON=%USERPROFILE%\.local\bin\python3.14.exe"

if not exist "%PYTHON%" (
  echo Python was not found at "%PYTHON%".
  echo Open this folder in VS Code and use Terminal - Run Task - Northstar: Serve locally.
  pause
  exit /b 1
)

:restart
echo Starting Northstar at http://127.0.0.1:8000
"%PYTHON%" -m http.server 8000 --bind 127.0.0.1
echo The web server stopped. Restarting in five seconds. Close this window to exit.
timeout /t 5 /nobreak >nul
goto restart
