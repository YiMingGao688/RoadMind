# 只向当前 PowerShell 及其子进程注入 RoadMind 配置；不修改用户/系统环境，不输出凭据。
function Import-RoadMindEnvironment {
    param([string]$Path = (Join-Path (Split-Path $PSScriptRoot -Parent) '.env.local'))
    if (Test-Path -LiteralPath $Path) {
        foreach ($line in [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $Path))) {
            if ($line -match '^\s*(ROADMIND_[A-Z0-9_]+)\s*=(.*)$') {
                $configName = $Matches[1]
                $configValue = $Matches[2]
                if ($configValue.Length -ge 2 -and (($configValue.StartsWith('"') -and $configValue.EndsWith('"')) -or ($configValue.StartsWith("'") -and $configValue.EndsWith("'")))) {
                    $configValue = $configValue.Substring(1, $configValue.Length - 2)
                }
                [Environment]::SetEnvironmentVariable($configName, $configValue, 'Process')
            }
        }
    }
    foreach ($configName in @('ROADMIND_DB_URL', 'ROADMIND_DB_USERNAME', 'ROADMIND_DB_PASSWORD')) {
        if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($configName, 'Process'))) {
            throw "Missing environment variable: $configName. Configure it in .env.local or the launching shell."
        }
    }
}
