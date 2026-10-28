param([switch]$AllowIncompleteEvidence, [switch]$DefenseKit)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repoRoot = (Resolve-Path (Join-Path $projectRoot '..')).Path
$requiredFiles = @('index.html','index.js','README.md','writeup.pdf')
if (Test-Path -LiteralPath (Join-Path $projectRoot 'demo.mp4')) { $requiredFiles += 'demo.mp4' }
elseif (-not $AllowIncompleteEvidence) { throw 'Missing demo.mp4. Use -AllowIncompleteEvidence only for an explicitly limited package.' }
foreach ($requiredFile in $requiredFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $projectRoot $requiredFile))) {
        throw "Missing $requiredFile. The preparation draft is not a complete submission."
    }
}
$bundledRoot = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies'
$pythonPath = Join-Path $bundledRoot 'python\python.exe'
if (-not (Test-Path -LiteralPath $pythonPath)) { $pythonPath = (Get-Command python -ErrorAction Stop).Source }
& $pythonPath (Join-Path $PSScriptRoot 'validate_measurements.py')
if ($LASTEXITCODE -ne 0) {
    if (-not $AllowIncompleteEvidence) { throw 'Complete and verify real field evidence before packaging.' }
    Write-Warning 'Available-evidence package: required measurements are incomplete. Read the limitations in writeup.pdf.'
}
if ($DefenseKit) {
    $requiredFiles += @('.gitattributes','DEFENSE_FINAL_RU.pdf','DEFENSE_FINAL_RU.md','MOODLE_LINKS.txt',
        'measurements.json','final_report_stats.json','FINAL_EVIDENCE_REVIEW_RU.md',
        'QA_RESULTS.md','LECTURE_AUDIT_RU.md','evidence','tests','package.json',
        'tools/build_final_reports.py','tools/build_reports.py','tools/validate_measurements.py',
        'tools/test_measurements.py','tools/package.ps1')
}
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
$outputName = if ($DefenseKit) { 'PA3_242458_Asset_defense_kit.zip' } else { 'PA3_242458_Asset.zip' }
$outputFile = Join-Path (Split-Path $repoRoot -Parent) $outputName
if (Test-Path -LiteralPath $outputFile) { throw "Archive already exists: $outputFile. Rename it before creating a new archive." }
# Archive committed files directly; this avoids a ZIP that differs from the commit.
& $gitExe.Source -c core.autocrlf=false -C $repoRoot archive --format=zip --output=$outputFile 'HEAD:pa3' @requiredFiles
if ($LASTEXITCODE -ne 0) { throw 'Git archive failed.' }
Write-Output "Created $outputFile from committed PA3 files."
