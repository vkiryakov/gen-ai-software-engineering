@echo off
REM Start the homework-1 NestJS application.
REM Usage: run.bat

setlocal

set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%.."

if not exist "%APP_DIR%\package.json" (
  echo Error: cannot find homework-1 package.json at %APP_DIR%
  exit /b 1
)

cd /d "%APP_DIR%"

where pnpm >nul 2>nul
if errorlevel 1 (
  echo Error: pnpm is not installed. Install it with: npm install -g pnpm
  exit /b 1
)

if not exist "node_modules" (
  echo ^>^> Installing dependencies with pnpm...
  call pnpm install
  if errorlevel 1 exit /b %errorlevel%
)

echo ^>^> Starting NestJS server in watch mode (http://localhost:3000)
echo ^>^> Swagger UI:  http://localhost:3000/docs
echo ^>^> Press Ctrl+C to stop.
call pnpm run start:dev

endlocal
