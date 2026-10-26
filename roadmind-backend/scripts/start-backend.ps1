param([switch]$Jar, [switch]$TestDatabase)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Import-LocalEnvironment.ps1')
Import-RoadMindEnvironment
if ($TestDatabase) {
    # 浏览器联调也使用独立测试库；保护条件在启动 Flyway 前执行。
    $testDatabaseUrl = $env:ROADMIND_TEST_DB_URL
    if ([string]::IsNullOrWhiteSpace($testDatabaseUrl)) {
        $developmentAddress = [Uri]$env:ROADMIND_DB_URL.Substring(5)
        $testDatabaseUrl = 'jdbc:' + $developmentAddress.GetLeftPart([UriPartial]::Authority) + '/roadmind_test' + $developmentAddress.Query
    }
    if (-not $testDatabaseUrl.StartsWith('jdbc:mysql://') -or ([Uri]$testDatabaseUrl.Substring(5)).AbsolutePath -notmatch '^/roadmind_test(?:_[A-Za-z0-9]+)*$') {
        throw 'Browser tests may only use an isolated roadmind_test database'
    }
    $env:ROADMIND_DB_URL = $testDatabaseUrl
    if ($env:ROADMIND_TEST_DB_USERNAME) { $env:ROADMIND_DB_USERNAME = $env:ROADMIND_TEST_DB_USERNAME }
    if ($env:ROADMIND_TEST_DB_PASSWORD) { $env:ROADMIND_DB_PASSWORD = $env:ROADMIND_TEST_DB_PASSWORD }
    $env:SERVER_PORT = '8081'
}
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    if ($Jar) {
        & java -jar 'target/roadmind-backend-1.0.0-SNAPSHOT.jar'
    } else {
        & mvn -B -ntp spring-boot:run
    }
    if ($LASTEXITCODE -ne 0) { throw "Backend exited with code $LASTEXITCODE" }
} finally { Pop-Location }
