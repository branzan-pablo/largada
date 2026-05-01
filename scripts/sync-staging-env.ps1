# =============================================================================
# Sync .env.staging -> Vercel (escopo: Preview + branch=staging)
# =============================================================================
# Para cada variavel em .env.staging:
#   1. Remove a entrada existente do escopo Preview e Development
#      (deixa a entrada de Production intacta para a branch main)
#   2. Adiciona uma nova entrada escopada a Preview + branch=staging
#
# Pre-requisitos:
#   - vercel CLI instalada (`pnpm add -g vercel` ou `npm i -g vercel`)
#   - vercel login feito
#   - vercel link executado (.vercel/ existe)
#   - .env.staging populado na raiz do repo
#
# Uso:
#   powershell -ExecutionPolicy Bypass -File scripts/sync-staging-env.ps1
# =============================================================================

$ErrorActionPreference = "Continue"

$repoRoot  = Split-Path -Parent $PSScriptRoot
$envFile   = Join-Path $repoRoot ".env.staging"
$vercelDir = Join-Path $repoRoot ".vercel"

if (-not (Test-Path $envFile)) {
    Write-Host "ERRO: .env.staging nao encontrado em $envFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $vercelDir)) {
    Write-Host "ERRO: pasta .vercel nao existe. Rode 'vercel link' antes." -ForegroundColor Red
    exit 1
}

# Localiza o vercel.cmd (npm global bin) — necessario porque PS 5.1 nao
# consegue piar stdin de forma confiavel pra .ps1 wrapper.
$vercelCmd = (Get-Command vercel -ErrorAction SilentlyContinue).Source
if (-not $vercelCmd) {
    Write-Host "ERRO: vercel CLI nao encontrada no PATH." -ForegroundColor Red
    exit 1
}
# Se for o wrapper .ps1, troca pelo .cmd irmao (mesmo diretorio)
if ($vercelCmd -like "*.ps1") {
    $cmdSibling = [System.IO.Path]::ChangeExtension($vercelCmd, "cmd")
    if (Test-Path $cmdSibling) { $vercelCmd = $cmdSibling }
}

Write-Host "Usando vercel: $vercelCmd" -ForegroundColor DarkGray
Write-Host "Lendo $envFile" -ForegroundColor Cyan
Write-Host ""

function Invoke-VercelProcess {
    param(
        [string[]] $VercelArgs,
        [string]   $StdinValue = $null,
        [int]      $TimeoutSec = 30
    )
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cmd.exe"
    # cmd /S /c "command" preserva quotes internas (sem /S, cmd strip-a a outer quote)
    $inner = '"' + $vercelCmd + '"'
    foreach ($a in $VercelArgs) {
        $inner += ' "' + ($a -replace '"', '\"') + '"'
    }
    $psi.Arguments = '/S /c "' + $inner + '"'
    $psi.RedirectStandardInput  = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true

    $proc = [System.Diagnostics.Process]::Start($psi)
    if ($StdinValue) {
        $proc.StandardInput.WriteLine($StdinValue)
    }
    $proc.StandardInput.Close()

    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()

    if (-not $proc.WaitForExit($TimeoutSec * 1000)) {
        try { $proc.Kill() } catch {}
        return [pscustomobject]@{ ExitCode = -1; Stdout = $stdout; Stderr = "TIMEOUT after ${TimeoutSec}s" }
    }
    return [pscustomobject]@{
        ExitCode = $proc.ExitCode
        Stdout   = $stdout
        Stderr   = $stderr
    }
}

$lines    = Get-Content $envFile
$ok       = 0
$skipped  = 0
$failed   = 0

foreach ($line in $lines) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed)) { continue }
    if ($trimmed.StartsWith("#")) { continue }

    $eqIdx = $trimmed.IndexOf("=")
    if ($eqIdx -lt 1) { continue }

    $name  = $trimmed.Substring(0, $eqIdx).Trim()
    $value = $trimmed.Substring($eqIdx + 1).Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
        ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
    }

    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Host ("  SKIP  {0,-40} (valor vazio)" -f $name) -ForegroundColor DarkYellow
        $skipped++
        continue
    }

    Write-Host (">> {0}" -f $name) -ForegroundColor White

    # 1) Remove escopo Preview existente
    $null = Invoke-VercelProcess -VercelArgs @("env", "rm", $name, "preview", "--yes")

    # 2) Remove escopo Development existente
    $null = Invoke-VercelProcess -VercelArgs @("env", "rm", $name, "development", "--yes")

    # 3) Adiciona escopado a Preview + branch=staging
    $r = Invoke-VercelProcess -VercelArgs @("env", "add", $name, "preview", "staging") -StdinValue $value -TimeoutSec 60
    if ($r.ExitCode -eq 0) {
        Write-Host ("  OK    {0,-40} -> Preview/staging" -f $name) -ForegroundColor Green
        $ok++
    } else {
        Write-Host ("  FAIL  {0,-40} (exit {1})" -f $name, $r.ExitCode) -ForegroundColor Red
        if ($r.Stderr) { Write-Host ("        stderr: " + $r.Stderr.Trim()) -ForegroundColor DarkRed }
        $failed++
    }
}

Write-Host ""
Write-Host "=== Resumo ===" -ForegroundColor Cyan
Write-Host ("  Sincronizadas: {0}" -f $ok)
Write-Host ("  Puladas      : {0}" -f $skipped)
Write-Host ("  Falhas       : {0}" -f $failed)
Write-Host ""
Write-Host "Verificar: vercel env ls" -ForegroundColor DarkGray
