# 只创建本项目的两个数据库；表结构由应用中的 Flyway 迁移负责。
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Import-LocalEnvironment.ps1')
Import-RoadMindEnvironment
if (-not $env:ROADMIND_DB_URL.StartsWith('jdbc:mysql://')) { throw 'Expected a MySQL JDBC URL' }
$databaseAddress = [Uri]$env:ROADMIND_DB_URL.Substring(5)
if ($databaseAddress.AbsolutePath.Trim('/') -ne 'roadmind') { throw 'The development database must be roadmind' }
$databasePort = if ($databaseAddress.Port -gt 0) { $databaseAddress.Port } else { 3306 }
$previousMysqlPassword = [Environment]::GetEnvironmentVariable('MYSQL_PWD', 'Process')
try {
    [Environment]::SetEnvironmentVariable('MYSQL_PWD', $env:ROADMIND_DB_PASSWORD, 'Process')
    $bootstrapSql = "CREATE DATABASE IF NOT EXISTS roadmind CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; CREATE DATABASE IF NOT EXISTS roadmind_test CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
    & mysql --connect-timeout=5 "--host=$($databaseAddress.Host)" "--port=$databasePort" "--user=$env:ROADMIND_DB_USERNAME" --execute=$bootstrapSql
    if ($LASTEXITCODE -ne 0) { throw 'Database initialization failed; check database permissions' }
    Write-Output 'roadmind and roadmind_test are ready. Flyway will create the application tables.'
} finally {
    [Environment]::SetEnvironmentVariable('MYSQL_PWD', $previousMysqlPassword, 'Process')
}
