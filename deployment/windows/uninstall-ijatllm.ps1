[CmdletBinding()]
param([switch]$DeleteData, [switch]$DeleteTunnel)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $ProjectRoot
try {
  if ($DeleteData) { docker compose down --volumes --remove-orphans }
  else { docker compose down --remove-orphans }
} finally { Pop-Location }

if ($DeleteTunnel) {
  Stop-Service IjatLLMTunnel -Force -ErrorAction SilentlyContinue
  sc.exe delete IjatLLMTunnel | Out-Null
  cloudflared tunnel delete --force ijatllm-windows
}

Write-Host "IjatLLM dihentikan. Data volume $($(if($DeleteData){'sudah dihapus'}else{'tetap disimpan'}))."
