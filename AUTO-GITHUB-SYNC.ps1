$ErrorActionPreference = "Continue"

$repo   = "C:\IjatLLM"
$branch = "main"
$logDir = Join-Path $env:LOCALAPPDATA "IjatLLM"
$log    = Join-Path $logDir "github-sync.log"

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

function Write-Log {
    param([string]$Message)

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $log -Value "[$timestamp] $Message" -Encoding UTF8
}

function Write-GitOutput {
    param([object[]]$Output)

    if ($Output -and $Output.Count -gt 0) {
        $text = ($Output | ForEach-Object { "$_" }) -join " | "
        Write-Log $text
    }
}

if (-not (Test-Path $repo)) {
    Write-Log "ERROR: Folder repositori tidak ditemukan."
    exit 1
}

Set-Location $repo

if (-not (Test-Path ".git")) {
    Write-Log "ERROR: C:\IjatLLM bukan repositori Git."
    exit 1
}

$currentBranch = "$(git branch --show-current 2>$null)".Trim()

if ($currentBranch -ne $branch) {
    Write-Log "ERROR: Branch aktif '$currentBranch', seharusnya '$branch'."
    exit 1
}

$gitDir = "$(git rev-parse --git-dir 2>$null)".Trim()

if (
    (Test-Path (Join-Path $gitDir "rebase-merge")) -or
    (Test-Path (Join-Path $gitDir "rebase-apply")) -or
    (Test-Path (Join-Path $gitDir "MERGE_HEAD"))
) {
    Write-Log "ERROR: Ada proses merge atau rebase yang belum selesai."
    exit 1
}

$status = @(git status --porcelain=v1)

if ($status.Count -gt 0) {
    $addOutput = @(git add -A 2>&1)
    $addExit = $LASTEXITCODE
    Write-GitOutput $addOutput

    if ($addExit -ne 0) {
        Write-Log "ERROR: git add gagal."
        exit $addExit
    }

    $staged = @(git -c core.quotepath=false diff --cached --name-only --diff-filter=ACMR)

    $blocked = @()
    $blockedExtensions = @(
        ".pem", ".key", ".p12", ".pfx",
        ".db", ".sqlite", ".sqlite3",
        ".log", ".zip", ".rar", ".7z", ".gz"
    )

    foreach ($path in $staged) {
        $lower = $path.Replace("\", "/").ToLowerInvariant()
        $extension = [System.IO.Path]::GetExtension($lower)

        $isEnvExample = $lower -match '(^|/)\.env\.example$'

        if (
            (-not $isEnvExample -and $lower -match '(^|/)\.env($|\.)') -or
            $lower -match '(^|/)(node_modules|\.venv|venv|__pycache__|backup|backups|logs?|tmp|temp|uploads?|postgres-data|redis-data|grafana-data|prometheus-data|minio-data|docker-data|volumes?|dist|build|\.next)(/|$)' -or
            $lower -match '(^|/)(id_rsa|id_ed25519|credentials\.json|service[-_]?account.*\.json|secrets?\.(json|ya?ml|txt))$' -or
            $blockedExtensions -contains $extension
        ) {
            $blocked += $path
        }
    }

    if ($blocked.Count -gt 0) {
        git reset --quiet
        Write-Log "UPLOAD DIBATALKAN: File terlarang: $($blocked -join ', ')"
        exit 2
    }

    $strongSecretRegex = '(?i)(-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|sk-[A-Za-z0-9_-]{20,}|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,})'
    $assignmentRegex = '(?i)\b(api[_-]?key|secret(?:_key)?|token|password|passwd|pwd|master[_-]?key|access[_-]?key)\b\s*[:=]\s*["''][^"'']{8,}["'']'
    $safeReferenceRegex = '(?i)(\$\{|\$env:|process\.env|os\.environ|os\.getenv|body\.|req\.|request\.|change[-_ ]?me|replace[-_ ]?me|example|dummy|sample|placeholder|your[_-]|<[^>]+>)'

    $textExtensions = @(
        ".ps1", ".py", ".js", ".jsx", ".ts", ".tsx",
        ".json", ".yaml", ".yml", ".toml", ".ini",
        ".conf", ".config", ".md", ".txt", ".html", ".css"
    )

    $secretHits = @()

    foreach ($path in $staged) {
        if ($path -ieq "AUTO-GITHUB-SYNC.ps1") {
            continue
        }

        $fullPath = Join-Path $repo ($path.Replace("/", "\"))
        $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()

        if ((Test-Path $fullPath) -and $textExtensions -contains $extension) {
            $lineNumber = 0

            foreach ($line in Get-Content -LiteralPath $fullPath -ErrorAction SilentlyContinue) {
                $lineNumber++

                if (
                    $line -match $strongSecretRegex -or
                    ($line -match $assignmentRegex -and $line -notmatch $safeReferenceRegex)
                ) {
                    $secretHits += "${path}:$lineNumber"
                }
            }
        }
    }

    if ($secretHits.Count -gt 0) {
        git reset --quiet
        Write-Log "UPLOAD DIBATALKAN: Kemungkinan rahasia ditemukan di $($secretHits -join ', ')"
        exit 3
    }

    git diff --cached --quiet
    $diffExit = $LASTEXITCODE

    if ($diffExit -eq 1) {
        $message = "Auto sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        $commitOutput = @(git commit -m $message 2>&1)
        $commitExit = $LASTEXITCODE
        Write-GitOutput $commitOutput

        if ($commitExit -ne 0) {
            Write-Log "ERROR: Commit otomatis gagal."
            exit $commitExit
        }
    }
    elseif ($diffExit -ne 0) {
        Write-Log "ERROR: Gagal memeriksa perubahan."
        exit $diffExit
    }
}

$pullOutput = @(git pull --rebase origin $branch 2>&1)
$pullExit = $LASTEXITCODE
Write-GitOutput $pullOutput

if ($pullExit -ne 0) {
    Write-Log "ERROR: git pull --rebase gagal. Periksa konflik atau koneksi."
    exit $pullExit
}

$pushOutput = @(git push origin $branch 2>&1)
$pushExit = $LASTEXITCODE
Write-GitOutput $pushOutput

if ($pushExit -ne 0) {
    Write-Log "ERROR: git push gagal."
    exit $pushExit
}

Write-Log "Sinkronisasi otomatis selesai."
exit 0
