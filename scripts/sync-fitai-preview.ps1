param(
    [string]$SourceRoot = 'C:\AbWork\FitAI',
    [string]$DestinationRoot = (Join-Path (Split-Path -Parent $PSScriptRoot) 'fitai-expo-preview')
)

$ErrorActionPreference = 'Stop'

$copyTargets = @(
    'App.js',
    'app.json',
    'babel.config.js',
    'index.js',
    'metro.config.js',
    'package.json',
    'package-lock.json',
    'assets',
    'src'
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$overrideRoot = Join-Path $repoRoot 'fitai-expo-preview-overrides'

if (-not (Test-Path -LiteralPath $DestinationRoot)) {
    New-Item -ItemType Directory -Path $DestinationRoot -Force | Out-Null
}

foreach ($target in $copyTargets) {
    $sourcePath = Join-Path $SourceRoot $target
    $destinationPath = Join-Path $DestinationRoot $target

    if (Test-Path -LiteralPath $sourcePath -PathType Container) {
        if (-not (Test-Path -LiteralPath $destinationPath)) {
            New-Item -ItemType Directory -Path $destinationPath -Force | Out-Null
        }
        Copy-Item -LiteralPath (Join-Path $sourcePath '*') -Destination $destinationPath -Recurse -Force
        continue
    }

    Copy-Item -LiteralPath $sourcePath -Destination $destinationPath -Force
}

if (Test-Path -LiteralPath $overrideRoot) {
    Get-ChildItem -LiteralPath $overrideRoot -Force | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $DestinationRoot -Recurse -Force
    }
}

Write-Output "FitAI preview synced to $DestinationRoot"
