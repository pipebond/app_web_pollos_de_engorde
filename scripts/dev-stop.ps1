$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$runtimeDir = Join-Path $root ".runtime"
$backendPidFile = Join-Path $runtimeDir "backend.pid"
$frontendPidFile = Join-Path $runtimeDir "frontend.pid"
$portsToFree = 3000, 3001

function Stop-TrackedProcess {
  param([string]$pidFilePath)

  if (Test-Path $pidFilePath) {
    $raw = Get-Content -Path $pidFilePath -ErrorAction SilentlyContinue | Select-Object -First 1
    $pidValue = 0
    if ([int]::TryParse([string]$raw, [ref]$pidValue) -and $pidValue -gt 0) {
      $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
      if ($proc) {
        Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
        Write-Output "Proceso detenido (PID $pidValue)."
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
    Write-Output "Puerto $port liberado (PID $ownedPid)."
  }
}

Stop-TrackedProcess -pidFilePath $backendPidFile
Stop-TrackedProcess -pidFilePath $frontendPidFile

foreach ($port in $portsToFree) {
  Free-Port -port $port
}

Write-Output "Servicios detenidos."
