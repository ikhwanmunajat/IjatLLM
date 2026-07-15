$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $ProjectRoot
try {
  docker compose pull
  docker compose up --build --detach --remove-orphans
  docker image prune --force
  docker compose ps
} finally { Pop-Location }
