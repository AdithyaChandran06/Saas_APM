@echo off
REM Quantora GitHub Deployment Cleanup Script (Windows)
REM Run this before pushing to GitHub to remove unnecessary files
REM Usage: cleanup-for-github.bat

setlocal enabledelayedexpansion
cls

echo.
echo 🧹 Quantora GitHub Deployment Cleanup (Windows)
echo ================================================
echo.

set cleanup_count=0

REM Function to remove item
set remove_item=^
if exist "%%item%%" (^
    echo Removing: %%item%%^
    echo   Reason: %%reason%%^
    rmdir /s /q "%%item%%" 2>nul ^
    if exist "%%item%%" del /s /q "%%item%%" 2>nul^
    echo ✓ Removed^
    set /a cleanup_count+=1^
)

echo 📦 Cleaning up dependencies and build artifacts...
echo.

REM Node modules
set item=Web-App-Builder\node_modules
set reason=npm dependencies (auto-installed from package.json)
%remove_item%

set item=Web-App-Builder\packages\apm-sdk\node_modules
set reason=SDK npm dependencies
%remove_item%

echo.
echo 🏗️ Cleaning up build outputs...
echo.

REM Build artifacts
set item=Web-App-Builder\dist
set reason=Production build output (regenerated from npm run build)
%remove_item%

set item=Web-App-Builder\packages\apm-sdk\dist
set reason=SDK build artifacts
%remove_item%

set item=Web-App-Builder\.turbo
set reason=Turbo cache
%remove_item%

set item=Web-App-Builder\.next
set reason=Next.js build cache
%remove_item%

echo.
echo 📝 Cleaning up environment and secrets...
echo.

REM Environment files
set item=Web-App-Builder\.env
set reason=Local environment variables with secrets
%remove_item%

set item=Web-App-Builder\.env.local
set reason=Local environment variables
%remove_item%

set item=Web-App-Builder\.env.production.local
set reason=Production environment variables
%remove_item%

set item=.env
set reason=Root environment file
%remove_item%

set item=.env.local
set reason=Root local environment file
%remove_item%

echo.
echo 💾 Cleaning up caches and logs...
echo.

REM Logs
set item=Web-App-Builder\npm-debug.log
set reason=npm debug log
%remove_item%

set item=npm-debug.log
set reason=Root npm debug log
%remove_item%

set item=.npm
set reason=npm cache
%remove_item%

set item=Web-App-Builder\.yarn
set reason=Yarn cache
%remove_item%

REM Testing
set item=Web-App-Builder\coverage
set reason=Test coverage reports
%remove_item%

set item=.nyc_output
set reason=NYC coverage output
%remove_item%

echo.
echo 🔍 Cleaning up IDE and OS files...
echo.

REM IDE files
set item=Web-App-Builder\.vscode
set reason=VS Code workspace settings
%remove_item%

set item=.vscode
set reason=Root VS Code settings
%remove_item%

set item=Web-App-Builder\.idea
set reason=JetBrains IDE files
%remove_item%

set item=.idea
set reason=Root JetBrains files
%remove_item%

set item=Web-App-Builder\.cursor
set reason=Cursor editor files
%remove_item%

REM OS files
set item=.DS_Store
set reason=macOS metadata
if exist "%%item%%" del /s /q "%%item%%" 2>nul

set item=Thumbs.db
set reason=Windows thumbnail cache
if exist "%%item%%" del /s /q "%%item%%" 2>nul

echo.
echo 🗑️ Cleaning up temporary files...
echo.

for /r . %%f in (*.tmp) do (
    echo Removing: %%f
    del /q "%%f" 2>nul
    set /a cleanup_count+=1
)

for /r . %%f in (*.bak) do (
    echo Removing: %%f
    del /q "%%f" 2>nul
    set /a cleanup_count+=1
)

echo.
echo ================================================
echo ✓ Cleanup Complete!
echo.
echo Items removed: !cleanup_count!
echo.
echo 📋 Verification:
echo ---
echo ✅ Should still have:
echo    - Web-App-Builder\client\ ^(React frontend^)
echo    - Web-App-Builder\server\ ^(Express backend^)
echo    - Web-App-Builder\migrations\ ^(DB migrations^)
echo    - Web-App-Builder\shared\ ^(Shared types^)
echo    - package.json ^& package-lock.json
echo    - .env.example ^(NOT .env^)
echo    - All documentation files
echo.

REM Check for .gitignore
if exist ".gitignore" (
    echo ✓ .gitignore exists
) else (
    echo ✗ .gitignore missing!
)

REM Check for remaining .env files
echo Checking for stray .env files...
for /r . %%f in (.env, .env.local, .env.production.local) do (
    if not "%%f"==".env.example" (
        echo ⚠️  Found: %%f
    )
)

echo.
echo 🚀 Next steps:
echo    1. Run: git status
echo    2. Verify only source code is staged
echo    3. Run: npm ci ^&^& npm run verify
echo    4. Run: git push origin main
echo.
echo ✓ Ready for GitHub deployment!
echo.

pause
