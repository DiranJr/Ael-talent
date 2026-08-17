$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$target = Join-Path $root 'opencats'

if (Test-Path (Join-Path $target '.git')) {
    Write-Host 'OpenCATS ja esta clonado. Atualizando...'
    git -C $target pull
} else {
    if (Test-Path $target) { Remove-Item $target -Recurse -Force }
    Write-Host 'Clonando OpenCATS oficial...'
    git clone https://github.com/opencats/OpenCATS.git $target
}

Write-Host ''
Write-Host 'Pronto.'
Write-Host 'Proximo passo:'
Write-Host "  cd `"$target\docker`""
Write-Host '  docker compose up -d'
Write-Host ''
Write-Host 'Prototipo visual: custom\careers\index.html'
