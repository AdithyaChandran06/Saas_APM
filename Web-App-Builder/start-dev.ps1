#!/usr/bin/env pwsh
# Start local dev environment: Postgres (docker compose) + local Node dev server
Set-Location $PSScriptRoot

Write-Host "Bringing down any existing compose stack (volumes preserved by default)..."
docker compose down || Write-Host "No compose stack to stop"

Write-Host "Starting Postgres in background..."
docker compose up -d postgres

Write-Host "Waiting 5s for Postgres to become ready..."
Start-Sleep -Seconds 5

Write-Host "Starting local dev server (npm run dev) from $PSScriptRoot"
# Use npm --prefix to ensure we run inside this folder even if the caller's cwd differs
npm --prefix $PSScriptRoot run dev
