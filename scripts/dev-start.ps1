$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $root ".runtime"
$backendPidFile = Join-Path $runtimeDir "backend.pid"
$frontendPidFile = Join-Path $runtimeDir "frontend.pid"
$backendLog = Join-Path $runtimeDir "backend.log"
$backendErrLog = Join-Path $runtimeDir "backend.err.log"
$frontendLog = Join-Path $runtimeDir "frontend.log"
$frontendErrLog = Join-Path $runtimeDir "frontend.err.log"
$portsToFree = 3000, 3001

if (-not (Test-Path $runtimeDir)) {
  New-Item -ItemType Directory -Path $runtimeDir | Out-Null
}

function Stop-TrackedProcess {
  param([string]$pidFilePath)

  if (Test-Path $pidFilePath) {
    $raw = Get-Content -Path $pidFilePath -ErrorAction SilentlyContinue | Select-Object -First 1
    $pidValue = 0
    if ([int]::TryParse([string]$raw, [ref]$pidValue) -and $pidValue -gt 0) {
      $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
      if ($proc) {
        Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
      }
    }
    Remove-Item $pidFilePath -ErrorAction SilentlyContinue
  }
}

function Free-Port {
  param([int]$port)

  $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($ownedPid in $pids) {
    Stop-Process -Id $ownedPid -Force -ErrorAction SilentlyContinue
  }
}

# Limpia procesos previamente rastreados por este script.
Stop-TrackedProcess -pidFilePath $backendPidFile
Stop-TrackedProcess -pidFilePath $frontendPidFile

# Libera puertos principales para evitar prompts y colisiones al iniciar.
foreach ($port in $portsToFree) {
  Free-Port -port $port
}

if (Test-Path $backendLog) { Remove-Item $backendLog -Force -ErrorAction SilentlyContinue }
if (Test-Path $backendErrLog) { Remove-Item $backendErrLog -Force -ErrorAction SilentlyContinue }
if (Test-Path $frontendLog) { Remove-Item $frontendLog -Force -ErrorAction SilentlyContinue }
if (Test-Path $frontendErrLog) { Remove-Item $frontendErrLog -Force -ErrorAction SilentlyContinue }

$backendProcess = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "--prefix", "server", "start" `
  -WorkingDirectory $root `
  -RedirectStandardOutput $backendLog `
  -RedirectStandardError $backendErrLog `
  -PassThru

$frontendProcess = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "--prefix", "client", "start" `
  -WorkingDirectory $root `
  -RedirectStandardOutput $frontendLog `
  -RedirectStandardError $frontendErrLog `
  -PassThru

$backendProcess.Id | Set-Content -Path $backendPidFile
$frontendProcess.Id | Set-Content -Path $frontendPidFile

Start-Sleep -Seconds 6

$listen = Get-NetTCPConnection -LocalPort 3000,3001 -State Listen -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess |
  Sort-Object LocalPort

Write-Output "Backend PID: $($backendProcess.Id)"
Write-Output "Frontend PID: $($frontendProcess.Id)"
Write-Output "Backend log: $backendLog"
Write-Output "Backend error log: $backendErrLog"
Write-Output "Frontend log: $frontendLog"
Write-Output "Frontend error log: $frontendErrLog"
Write-Output "Puertos activos (3000/3001):"
$listen | Format-Table -AutoSize

if (-not $listen) {
  Write-Warning "No se detectaron puertos 3000/3001 en escucha. Revisa los logs en .runtime/."
}
