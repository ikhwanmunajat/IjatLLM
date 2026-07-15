[CmdletBinding()]
param([int]$HttpPort = 8080)

$ErrorActionPreference = "Continue"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Write-Host "IjatLLM diagnostics" -ForegroundColor Cyan
Write-Host "Windows: $([Environment]::OSVersion.VersionString)"
Write-Host "Docker : $((docker version --format '{{.Server.Version}}' 2>$null))"
Write-Host "Tunnel : $((Get-Service IjatLLMTunnel -ErrorAction SilentlyContinue).Status)"

Push-Location $ProjectRoot
docker compose ps
docker compose logs --tail 80 nginx web app-api litellm
Pop-Location

try {
  $result = Invoke-WebRequest -Uri "http://127.0.0.1:$HttpPort" -Headers @{ Host = "ijatllm.my.id" } -UseBasicParsing -TimeoutSec 8
  Write-Host "Local origin: HTTP $($result.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "Local origin gagal: $($_.Exception.Message)" -ForegroundColor Red
}

Resolve-DnsName ijatllm.my.id -ErrorAction Continue
cloudflared tunnel info ijatllm-windows 2>$null
