[CmdletBinding()]
param(
  [string]$Domain = "ijatllm.my.id",
  [int]$HttpPort = 8080,
  [switch]$SkipCloudflare,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$EnvFile = Join-Path $ProjectRoot ".env"
$CloudflaredDir = Join-Path $env:USERPROFILE ".cloudflared"
$CloudflaredServiceDir = Join-Path $env:ProgramData "IjatLLM\cloudflared"
$TunnelName = "ijatllm-windows"
$TunnelServiceName = "IjatLLMTunnel"

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Test-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function New-Secret([int]$Bytes = 32) {
  $buffer = New-Object byte[] $Bytes
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try { $generator.GetBytes($buffer) } finally { $generator.Dispose() }
  return [Convert]::ToBase64String($buffer).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Test-DockerReady {
  & docker info *> $null
  return $LASTEXITCODE -eq 0
}

function Wait-DockerReady([int]$TimeoutSeconds = 120) {
  $dockerDesktop = Join-Path $env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
  if (-not (Test-DockerReady)) {
    if (-not (Test-Path $dockerDesktop)) { throw "Docker Desktop tidak ditemukan setelah instalasi." }
    Write-Host "Menjalankan Docker Desktop dan menunggu Linux Engine..." -ForegroundColor Yellow
    Start-Process $dockerDesktop -ErrorAction SilentlyContinue
  }
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (Test-DockerReady) {
      $osType = (& docker info --format '{{.OSType}}' 2>$null).Trim()
      if ($osType -ne "linux") { throw "Docker sedang memakai Windows containers. Pilih 'Switch to Linux containers' pada Docker Desktop." }
      return
    }
    Start-Sleep -Seconds 5
  }
  throw "Docker Desktop belum siap. Pastikan Docker Desktop terbuka, selesaikan persetujuan awal bila muncul, dan tunggu hingga Engine running. Setelah itu jalankan installer kembali."
}

function Set-DotEnvValue([string]$Path, [string]$Name, [string]$Value) {
  $escapedName = [Regex]::Escape($Name)
  $content = Get-Content -LiteralPath $Path -Raw
  if ($content -match "(?m)^$escapedName=") {
    $content = [Regex]::Replace($content, "(?m)^$escapedName=.*$", "$Name=$Value")
  } else {
    $content = $content.TrimEnd() + "`r`n$Name=$Value`r`n"
  }
  [IO.File]::WriteAllText($Path, $content, [Text.UTF8Encoding]::new($false))
}

function Get-DotEnvValue([string]$Path, [string]$Name) {
  $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match "^$([Regex]::Escape($Name))=" } | Select-Object -First 1
  if (-not $line) { return "" }
  return $line.Substring($line.IndexOf("=") + 1)
}

function Require-Command([string]$Name, [string]$InstallId) {
  if (Get-Command $Name -ErrorAction SilentlyContinue) { return }
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "$Name belum terpasang dan winget tidak tersedia. Instal $InstallId lalu jalankan ulang installer."
  }
  Write-Step "Memasang $InstallId"
  winget install --id $InstallId --exact --accept-package-agreements --accept-source-agreements
  $env:PATH = [Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [Environment]::GetEnvironmentVariable("PATH", "User")
}

if (-not (Test-Admin)) {
  throw "Jalankan Windows Terminal atau PowerShell sebagai Administrator."
}

Write-Step "Memeriksa Windows 11, WSL2, Docker, dan cloudflared"
if ([Environment]::OSVersion.Version.Build -lt 22000) { throw "Installer ini memerlukan Windows 11." }
if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
  wsl --install --no-distribution
  throw "WSL2 sedang dipasang. Restart Windows, lalu jalankan installer ini kembali."
}

Require-Command "docker" "Docker.DockerDesktop"
if (-not $SkipCloudflare) { Require-Command "cloudflared" "Cloudflare.cloudflared" }

Wait-DockerReady

Write-Step "Membuat konfigurasi rahasia"
if (-not (Test-Path $EnvFile)) { Copy-Item (Join-Path $ProjectRoot ".env.example") $EnvFile }
Set-DotEnvValue $EnvFile "APP_URL" "https://app.$Domain"
Set-DotEnvValue $EnvFile "IJAT_HTTP_PORT" "$HttpPort"
Set-DotEnvValue $EnvFile "NEXT_PUBLIC_APP_URL" "https://app.$Domain"
Set-DotEnvValue $EnvFile "NEXT_PUBLIC_API_URL" "https://app.$Domain/api/app"
Set-DotEnvValue $EnvFile "NEXT_PUBLIC_LITELLM_API_URL" "https://api.$Domain"

$secrets = @{
  "APP_POSTGRES_PASSWORD" = New-Secret 24
  "LITELLM_POSTGRES_PASSWORD" = New-Secret 24
  "AUTH_SECRET" = New-Secret 48
  "LITELLM_MASTER_KEY" = "sk-" + (New-Secret 32)
  "LITELLM_SALT_KEY" = New-Secret 32
  "ENCRYPTION_KEY" = New-Secret 32
  "INTERNAL_SERVICE_SECRET" = New-Secret 32
  "GRAFANA_ADMIN_PASSWORD" = New-Secret 24
}
foreach ($entry in $secrets.GetEnumerator()) {
  $existing = Get-DotEnvValue $EnvFile $entry.Key
  if (-not $existing -or $existing -match "change-me|replace-with") {
    Set-DotEnvValue $EnvFile $entry.Key $entry.Value
  }
}
$appDbPassword = Get-DotEnvValue $EnvFile "APP_POSTGRES_PASSWORD"
$litellmDbPassword = Get-DotEnvValue $EnvFile "LITELLM_POSTGRES_PASSWORD"
Set-DotEnvValue $EnvFile "APP_DATABASE_URL" "postgresql+psycopg://ijat:$appDbPassword@postgres-app:5432/ijat_app"
Set-DotEnvValue $EnvFile "LITELLM_DATABASE_URL" "postgresql://litellm:$litellmDbPassword@postgres-litellm:5432/litellm"

Write-Step "Membuka konfigurasi provider AI"
Write-Host "Isi minimal satu provider API key. Simpan file, lalu kembali ke terminal ini." -ForegroundColor Yellow
Start-Process notepad.exe $EnvFile -Wait

if (-not $SkipBuild) {
  Write-Step "Membangun dan menjalankan stack IjatLLM"
  Push-Location $ProjectRoot
  try {
    docker compose pull
    docker compose up --build --detach
  } finally { Pop-Location }
}

Write-Step "Memeriksa kesehatan container"
Push-Location $ProjectRoot
try { docker compose ps } finally { Pop-Location }
$localUrl = "http://127.0.0.1:$HttpPort"
for ($attempt = 1; $attempt -le 24; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri $localUrl -Headers @{ Host = $Domain } -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) { break }
  } catch {
    if ($attempt -eq 24) { throw "IjatLLM belum sehat di $localUrl. Jalankan diagnose-ijatllm.ps1." }
    Start-Sleep -Seconds 5
  }
}

if (-not $SkipCloudflare) {
  Write-Step "Menghubungkan Cloudflare Tunnel"
  New-Item -ItemType Directory -Force -Path $CloudflaredDir | Out-Null
  $cert = Join-Path $CloudflaredDir "cert.pem"
  if (-not (Test-Path $cert)) {
    Write-Host "Browser Cloudflare akan terbuka. Pilih zone $Domain dan izinkan tunnel." -ForegroundColor Yellow
    cloudflared tunnel login
  }

  $tunnels = cloudflared tunnel list --output json | ConvertFrom-Json
  $tunnel = $tunnels | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
  if (-not $tunnel) {
    cloudflared tunnel create $TunnelName
    $tunnels = cloudflared tunnel list --output json | ConvertFrom-Json
    $tunnel = $tunnels | Where-Object { $_.name -eq $TunnelName } | Select-Object -First 1
  }
  if (-not $tunnel) { throw "Tunnel $TunnelName gagal dibuat." }

  $hostnames = @($Domain, "www.$Domain", "app.$Domain", "api.$Domain", "gateway.$Domain", "admin.$Domain", "docs.$Domain", "status.$Domain")
  foreach ($hostname in $hostnames) {
    cloudflared tunnel route dns --overwrite-dns $tunnel.id $hostname
  }

  New-Item -ItemType Directory -Force -Path $CloudflaredServiceDir | Out-Null
  $sourceCredentials = Join-Path $CloudflaredDir "$($tunnel.id).json"
  $serviceCredentials = Join-Path $CloudflaredServiceDir "$($tunnel.id).json"
  Copy-Item $sourceCredentials $serviceCredentials -Force
  $credentials = $serviceCredentials.Replace("\", "/")
  $configPath = Join-Path $CloudflaredServiceDir "config.yml"
  $ingress = ($hostnames | ForEach-Object { "  - hostname: $_`n    service: $localUrl" }) -join "`n"
  $yaml = @"
tunnel: $($tunnel.id)
credentials-file: $credentials
ingress:
$ingress
  - service: http_status:404
"@
  [IO.File]::WriteAllText($configPath, $yaml, [Text.UTF8Encoding]::new($false))

  $service = Get-Service $TunnelServiceName -ErrorAction SilentlyContinue
  if ($service) {
    Stop-Service $TunnelServiceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $TunnelServiceName | Out-Null
    Start-Sleep -Seconds 2
  }
  $cloudflaredExe = (Get-Command cloudflared).Source
  $binaryPath = "`"$cloudflaredExe`" --config `"$configPath`" tunnel run"
  New-Service -Name $TunnelServiceName -BinaryPathName $binaryPath -DisplayName "IjatLLM Cloudflare Tunnel" -Description "Private HTTPS tunnel for $Domain" -StartupType Automatic | Out-Null
  Start-Service $TunnelServiceName
}

Write-Step "Instalasi selesai"
Write-Host "Landing : https://$Domain"
Write-Host "Dashboard: https://app.$Domain"
Write-Host "API      : https://api.$Domain/v1"
Write-Host "Gateway  : https://gateway.$Domain/ui"
Write-Host "Admin    : https://admin.$Domain"
Write-Host "Docs     : https://docs.$Domain"
Write-Host "Status   : https://status.$Domain"
Write-Host "`nSimpan .env dengan aman dan jangan pernah mengirim LITELLM_MASTER_KEY ke browser." -ForegroundColor Yellow
