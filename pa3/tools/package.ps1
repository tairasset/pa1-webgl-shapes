$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repoRoot = (Resolve-Path (Join-Path $projectRoot '..')).Path
$requiredFiles = @('index.html','index.js','README.md','writeup.pdf','demo.mp4')
foreach ($requiredFile in $requiredFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $requiredFile))) {
        throw "Missing $requiredFile. The preparation draft is not a complete submission."
    }
}
$bundledRoot = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$pythonPath = Join-Path $bundledRoot 'python\python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) { $pythonPath = (Get-Command python -ErrorAction Stop).Source }
& $pythonPath (Join-Path $PSScriptRoot 'validate_measurements.py')
if ($LASTEXITCODE -ne 0) { throw 'Complete and verify real field evidence before packaging.' }
$gitPath = Join-Path $bundledRoot 'native\git\cmd\git.exe'
if (-not (Test-Path -LiteralPath $gitPath)) { $gitPath = (Get-Command git -ErrorAction Stop).Source }
$gitExe = @{Source=$gitPath}
$dirty = & $gitExe.Source -C $repoRoot status --porcelain -- pa3
if ($dirty) { throw 'Commit the final PA3 files before packaging.' }
$commitRows = @(& $gitExe.Source -C $repoRoot log --format='%h|%cI' -- pa3)
$days = @($commitRows | ForEach-Object { ($_ -split '\|')[1].Substring(0,10) } | Sort-Object -Unique)
if ($commitRows.Count -lt 5 -or $days.Count -lt 2) { throw 'PA3 needs at least 5 meaningful commits on at least 2 actual days. Do not backdate commits.' }
$headDate = [DateTimeOffset]::Parse((& $gitExe.Source -C $repoRoot log -1 --format='%cI'))
$deadline = [DateTimeOffset]::Parse('2026-10-28T22:00:00+05:00')
if ($headDate -gt $deadline) { throw 'HEAD is after the deadline; select and verify the last on-time commit.' }
$outputFile = Join-Path (Split-Path $repoRoot -Parent) 'PA3_242458_Asset.zip'
if (Test-Path -LiteralPath $outputFile) { throw "Archive already exists: $outputFile. Rename it before creating a new archive." }
# Archive committed files directly; this avoids a ZIP that differs from the commit.
& $gitExe.Source -C $repoRoot archive --format=zip --output=$outputFile 'HEAD:pa3' @requiredFiles
if ($LASTEXITCODE -ne 0) { throw 'Git archive failed.' }
Write-Output "Created $outputFile from committed PA3 files."
