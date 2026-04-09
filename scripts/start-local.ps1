$root = Split-Path -Parent $PSScriptRoot

Write-Host "Friends Chit local launch checks" -ForegroundColor Cyan

$backendEnv = Join-Path $root "backend\.env"
$frontendEnv = Join-Path $root "frontend\.env"
$dbPath = $null

if (-not (Test-Path $backendEnv)) {
  Write-Host "Missing backend/.env" -ForegroundColor Red
}

if (-not (Test-Path $frontendEnv)) {
  Write-Host "Missing frontend/.env" -ForegroundColor Red
}

Write-Host ""
Write-Host "Required values:" -ForegroundColor Yellow
Write-Host "backend/.env -> SQLITE_DB_PATH, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, CORS_ORIGIN"
Write-Host "frontend/.env -> VITE_API_BASE_URL, VITE_CLERK_PUBLISHABLE_KEY"

if (Test-Path $backendEnv) {
  $databaseLine = Get-Content $backendEnv | Where-Object { $_ -match '^SQLITE_DB_PATH=' } | Select-Object -First 1
  if ($databaseLine) {
    $dbPath = ($databaseLine -replace '^SQLITE_DB_PATH=', '').Trim().Trim('"')
  } else {
    $dbPath = ".\data\chit_fund.sqlite"
  }

  if (-not [System.IO.Path]::IsPathRooted($dbPath)) {
    $dbPath = Join-Path $root "backend\$dbPath"
  }

  Write-Host ""
  Write-Host "Database target:" -ForegroundColor Yellow
  Write-Host "  SQLite file: $dbPath"

  $dbDir = Split-Path -Parent $dbPath
  if (Test-Path $dbDir) {
    Write-Host "  Database directory is available." -ForegroundColor Green
  } else {
    Write-Host "  Database directory will be created on first backend start." -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Backend start:" -ForegroundColor Green
Write-Host "  cd backend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "Frontend start:" -ForegroundColor Green
Write-Host "  cd frontend"
Write-Host "  npm run dev"
Write-Host ""
Write-Host "SQLite is local-only, so no PostgreSQL or Neon connection is required."
