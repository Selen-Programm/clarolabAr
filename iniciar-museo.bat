@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8000/museo.html"
  py -m http.server 8000 --bind 127.0.0.1
  goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:8000/museo.html"
  python -m http.server 8000 --bind 127.0.0.1
  goto :eof
)
echo No se encontro Python. Instala Python desde python.org y volve a abrir este archivo.
pause
