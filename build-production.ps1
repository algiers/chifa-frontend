# build-production.ps1

Write-Host "🚀 Build de production pour Chifa.ai Frontend"
Write-Host "=============================================="

# Nettoyage des caches
Write-Host "🧹 Nettoyage des caches..."
if (Test-Path .next) { Remove-Item .next -Recurse -Force }
if (Test-Path node_modules/.cache) { Remove-Item node_modules/.cache -Recurse -Force }
npm cache clean --force

# Installation des dépendances
Write-Host "📦 Installation des dépendances..."
npm install

# Build de production
Write-Host "🔨 Build de production..."
$env:NODE_ENV = "production"
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build réussi !"
    Write-Host "📊 Taille du build:"
    if (Test-Path .next) {
        $size = (Get-ChildItem .next -Recurse | Measure-Object -Property Length -Sum).Sum
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Host (".next/ : $sizeMB MB")
    }
} else {
    Write-Host "❌ Erreur lors du build"
    exit 1
}

Write-Host "🎉 Build terminé avec succès !" 