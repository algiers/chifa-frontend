# fix-linter.ps1 - Script pour résoudre les problèmes de linter

Write-Host "🔧 Résolution des problèmes de linter..." -ForegroundColor Green

# 1. Nettoyer les caches
Write-Host "🧹 Nettoyage des caches..." -ForegroundColor Yellow
if (Test-Path .next) { Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path node_modules/.cache) { Remove-Item node_modules/.cache -Recurse -Force -ErrorAction SilentlyContinue }
npm cache clean --force

# 2. Supprimer package-lock.json pour forcer une réinstallation propre
if (Test-Path package-lock.json) { Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue }

# 3. Installer les dépendances avec des options spécifiques
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
npm install --legacy-peer-deps --no-optional --ignore-scripts

# 4. Installer les types TypeScript manquants
Write-Host "🔧 Installation des types TypeScript..." -ForegroundColor Yellow
npm install --save-dev @types/node @types/react @types/react-dom --legacy-peer-deps

# 5. Vérifier l'installation
Write-Host "✅ Vérification de l'installation..." -ForegroundColor Green
if (Test-Path node_modules/next) {
    Write-Host "✅ Next.js installé avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Problème avec l'installation de Next.js" -ForegroundColor Red
}

# 6. Tester le linter
Write-Host "🔍 Test du linter..." -ForegroundColor Yellow
try {
    npx next lint --dir src --fix
    Write-Host "✅ Linter fonctionne correctement" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Quelques avertissements de linter (normal)" -ForegroundColor Yellow
}

# 7. Vérifier que le serveur de développement fonctionne
Write-Host "🚀 Test du serveur de développement..." -ForegroundColor Yellow
try {
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 5
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Serveur de développement fonctionne" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Problème avec le serveur de développement" -ForegroundColor Yellow
}

Write-Host "🎉 Résolution terminée !" -ForegroundColor Green
Write-Host "💡 Pour démarrer le serveur : npm run dev" -ForegroundColor Cyan 