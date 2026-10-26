param([switch]$Package)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Import-LocalEnvironment.ps1')
Import-RoadMindEnvironment
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    $mavenGoal = if ($Package) { 'verify' } else { 'test' }
    & mvn -B -ntp $mavenGoal
    if ($LASTEXITCODE -ne 0) { throw "Maven $mavenGoal failed with code $LASTEXITCODE" }
} finally { Pop-Location }
