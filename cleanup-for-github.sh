#!/bin/bash

# Quantora GitHub Deployment Cleanup Script
# Run this before pushing to GitHub to remove unnecessary files
# Usage: bash cleanup-for-github.sh

echo "🧹 Quantora GitHub Deployment Cleanup"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cleanup_count=0

# Function to remove a file/directory safely
remove_item() {
    local item=$1
    local reason=$2
    
    if [ -e "$item" ] || [ -d "$item" ]; then
        echo -e "${YELLOW}Removing:${NC} $item"
        echo "  Reason: $reason"
        rm -rf "$item"
        ((cleanup_count++))
        echo -e "${GREEN}✓ Removed${NC}"
    fi
}

echo "📦 Cleaning up dependencies and build artifacts..."
echo ""

# Node modules
remove_item "Web-App-Builder/node_modules" "npm dependencies (auto-installed from package.json)"
remove_item "Web-App-Builder/packages/apm-sdk/node_modules" "SDK npm dependencies"

echo ""
echo "🏗️ Cleaning up build outputs..."
echo ""

# Build artifacts
remove_item "Web-App-Builder/dist" "Production build output (regenerated from npm run build)"
remove_item "Web-App-Builder/packages/apm-sdk/dist" "SDK build artifacts"
remove_item "Web-App-Builder/.turbo" "Turbo cache"
remove_item "Web-App-Builder/.next" "Next.js build (if present)"

echo ""
echo "📝 Cleaning up environment and secrets..."
echo ""

# Environment files
remove_item "Web-App-Builder/.env" "Local environment variables with secrets"
remove_item "Web-App-Builder/.env.local" "Local environment variables"
remove_item "Web-App-Builder/.env.production.local" "Production environment variables"
remove_item ".env" "Root environment file"
remove_item ".env.local" "Root local environment file"

echo ""
echo "💾 Cleaning up caches and logs..."
echo ""

# Logs
remove_item "Web-App-Builder/npm-debug.log" "npm debug log"
remove_item "npm-debug.log" "Root npm debug log"
remove_item ".npm" "npm cache"
remove_item "Web-App-Builder/.yarn" "Yarn cache (if present)"

# TypeScript cache
remove_item "Web-App-Builder/*.tsbuildinfo" "TypeScript build info"

# Testing
remove_item "Web-App-Builder/coverage" "Test coverage reports"
remove_item ".nyc_output" "NYC coverage output"

echo ""
echo "🔍 Cleaning up IDE and OS files..."
echo ""

# IDE files
remove_item "Web-App-Builder/.vscode" "VS Code workspace settings"
remove_item ".vscode" "Root VS Code settings"
remove_item "Web-App-Builder/.idea" "JetBrains IDE files"
remove_item ".idea" "Root JetBrains files"
remove_item "Web-App-Builder/.cursor" "Cursor editor files"
remove_item ".cursor" "Root Cursor files"

# OS files
remove_item ".DS_Store" "macOS metadata"
remove_item "**/.DS_Store" "Nested macOS metadata"
remove_item "Thumbs.db" "Windows thumbnail cache"

echo ""
echo "🗑️ Cleaning up temporary files..."
echo ""

# Temp files
remove_item "Web-App-Builder/*.tmp" "Temporary files"
remove_item "Web-App-Builder/*.bak" "Backup files"
remove_item ".git/index.lock" "Git lock file (if present)"

echo ""
echo "======================================"
echo -e "${GREEN}✓ Cleanup Complete!${NC}"
echo ""
echo "Items removed: $cleanup_count"
echo ""
echo "📋 Verification:"
echo "---"

# Show what should remain
echo "✅ Should still have:"
echo "   - Web-App-Builder/client/ (React frontend)"
echo "   - Web-App-Builder/server/ (Express backend)"
echo "   - Web-App-Builder/migrations/ (DB migrations)"
echo "   - Web-App-Builder/shared/ (Shared types)"
echo "   - package.json & package-lock.json"
echo "   - .env.example (NOT .env)"
echo "   - All documentation files"
echo ""

# Verify gitignore
if [ -f ".gitignore" ]; then
    echo -e "${GREEN}✓${NC} .gitignore exists"
else
    echo -e "${RED}✗${NC} .gitignore missing!"
fi

# Check for remaining .env files
env_files=$(find . -name ".env*" -not -name ".env.example" 2>/dev/null | head -5)
if [ ! -z "$env_files" ]; then
    echo -e "${RED}⚠️  Found .env files that shouldn't be committed:${NC}"
    echo "$env_files"
else
    echo -e "${GREEN}✓${NC} No .env files found (except .env.example)"
fi

echo ""
echo "🚀 Next steps:"
echo "   1. Run: git status"
echo "   2. Verify only source code is staged"
echo "   3. Run: npm ci && npm run verify"
echo "   4. Run: git push origin main"
echo ""
echo -e "${GREEN}Ready for GitHub deployment!${NC}"
