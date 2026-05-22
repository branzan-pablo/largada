# =============================================================================
# Alterna o .env.local entre staging e prod sem perder configuracoes.
# =============================================================================
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/switch-local-env.ps1 staging
#   powershell -ExecutionPolicy Bypass -File scripts/switch-local-env.ps1 prod
#
# - staging: copia .env.staging para .env.local, troca NEXT_PUBLIC_APP_URL
#            por http://localhost:3000 (URL que o browser usa em dev).
# - prod   : copia .env.local.prod-backup para .env.local.
#
# Antes de rodar a primeira vez, este script faz backup do .env.local
# atual em .env.local.prod-backup (assumindo que ele tinha valores de prod).
# =============================================================================

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("staging", "prod")]
    [string] $Target
)

$ErrorActionPreference = "Stop"

$repoRoot     = Split-Path -Parent $PSScriptRoot
$envLocal     = Join-Path $repoRoot ".env.local"
$envStaging   = Join-Path $repoRoot ".env.staging"
$prodBackup   = Join-Path $repoRoot ".env.local.prod-backup"

function Backup-CurrentLocalAsProd {
    if (-not (Test-Path $envLocal)) { return }
    if (Test-Path $prodBackup) { return }
    Write-Host "Fazendo backup do .env.local atual em .env.local.prod-backup" -ForegroundColor Yellow
    Copy-Item -Path $envLocal -Destination $prodBackup -Force
}

if ($Target -eq "staging") {
    if (-not (Test-Path $envStaging)) {
        Write-Host "ERRO: .env.staging nao encontrado." -ForegroundColor Red
        exit 1
    }

    Backup-CurrentLocalAsProd

    # Le o staging, troca NEXT_PUBLIC_APP_URL por localhost
    $lines = Get-Content -Path $envStaging
    $output = New-Object System.Collections.Generic.List[string]
    $sawAppUrl = $false
    foreach ($line in $lines) {
        if ($line -match '^\s*NEXT_PUBLIC_APP_URL\s*=') {
            $output.Add("NEXT_PUBLIC_APP_URL=http://localhost:3000")
            $sawAppUrl = $true
        } else {
            $output.Add($line)
        }
    }
    if (-not $sawAppUrl) {
        $output.Add("NEXT_PUBLIC_APP_URL=http://localhost:3000")
    }
    # Escreve UTF-8 sem BOM para nao quebrar parsers de .env
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllLines($envLocal, $output, $utf8NoBom)

    Write-Host ""
    Write-Host "OK   .env.local agora aponta para STAGING (Supabase, Vercel, Strava, AbacatePay, VAPID, Cron)" -ForegroundColor Green
    Write-Host "     NEXT_PUBLIC_APP_URL = http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "Restart pnpm dev se ja estava rodando." -ForegroundColor DarkGray
    exit 0
}

if ($Target -eq "prod") {
    if (-not (Test-Path $prodBackup)) {
        Write-Host "ERRO: .env.local.prod-backup nao encontrado. Sem backup para restaurar." -ForegroundColor Red
        Write-Host "      Cole manualmente os valores de producao em .env.local."     -ForegroundColor Red
        exit 1
    }

    Copy-Item -Path $prodBackup -Destination $envLocal -Force
    Write-Host ""
    Write-Host "OK   .env.local agora aponta para PRODUCAO" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ATENCAO: voce esta atingindo dados reais. Restart pnpm dev." -ForegroundColor Red
    exit 0
}
