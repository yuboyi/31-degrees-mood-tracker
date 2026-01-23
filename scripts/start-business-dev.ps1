<#
.SYNOPSIS
  Launches the Vite dev server and opens the business integration page in the default browser.

.DESCRIPTION
  - Optionally installs dependencies if node_modules is missing.
  - Starts `npm run dev` in a dedicated PowerShell window so logs remain visible.
  - Polls http://localhost:5173 until the dev server is ready, then opens /business.
  - If the server never becomes reachable, a warning is displayed instead of launching the browser.

.PARAMETER Install
  Attempt to run `npm install` before starting the dev server. Defaults to automatic behaviour
  (installs only when node_modules is absent).
#>

[CmdletBinding()]
param (
  [switch]$Install
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Resolve the repository root (the script lives in ./scripts/)
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

function Install-Dependencies {
  Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
  npm install
}

$nodeModulesPath = Join-Path $repoRoot 'node_modules'

if ($Install.IsPresent -or -not (Test-Path -LiteralPath $nodeModulesPath)) {
  Install-Dependencies
}

# Launch dev server in a separate PowerShell window so it stays running for interactive use.
Write-Host "Starting Vite dev server (npm run dev)..." -ForegroundColor Cyan
$devCommand = 'npm run dev'
$devProcess = Start-Process -FilePath 'powershell.exe' `
  -ArgumentList @('-NoExit', '-Command', $devCommand) `
  -WorkingDirectory $repoRoot `
  -PassThru

$baseUrl = 'http://localhost:5173'
$businessUrl = "$baseUrl/business"
$maxAttempts = 60
$delaySeconds = 1

Write-Host "Waiting for Vite dev server to become available at $baseUrl ..." -ForegroundColor Yellow
$serverReady = $false

for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
  try {
    Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 2 | Out-Null
    $serverReady = $true
    break
  } catch {
    Start-Sleep -Seconds $delaySeconds
    if ($devProcess.HasExited) {
      throw "npm run dev process exited unexpectedly with code $($devProcess.ExitCode)."
    }
  }
}

if ($serverReady) {
  Write-Host "Dev server is ready. Opening $businessUrl ..." -ForegroundColor Green
  Start-Process $businessUrl | Out-Null
} else {
  Write-Warning "Timed out waiting for $baseUrl. Please ensure the dev server started correctly."
}

Write-Host "Done. Dev server logs are available in window PID $($devProcess.Id)." -ForegroundColor Cyan
