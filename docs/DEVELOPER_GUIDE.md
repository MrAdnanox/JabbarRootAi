# Guide du Développeur JabbarRoot

## Table des Matières
1. [Installation](#installation)
2. [Commandes de Base](#commandes-de-base)
3. [Développement](#développement)
4. [Tests](#tests)
5. [Packaging](#packaging)
6. [Déploiement](#déploiement)
7. [Dépannage](#dépannage)

## Installation

### Prérequis
- Node.js 16+
- pnpm 7+
- VS Code 1.70+

### Configuration Initiale
```bash
# Installer les dépendances globales
npm install -g pnpm @vscode/vsce

# Cloner le dépôt
git clone https://github.com/MrAdnanox/JabbarRootAi.git
cd JabbarRoot

# Installer les dépendances
pnpm install
```

## Commandes de Base

### Depuis la racine du projet
```bash
# Construire tous les packages
pnpm build

# Nettoyer les fichiers générés
pnpm clean

# Lancer les tests
pnpm test
```

## Développement

### Structure des Dossiers
```
JabbarRoot/
├── apps/
│   └── vscode-extension/    # Extension VS Code
├── packages/
│   ├── core/               # Logique métier principale
│   ├── types/              # Définitions de types partagés
│   └── ...
└── docs/                   # Documentation
```

### Commandes de Développement
```bash
# Lancer le mode watch pour le développement
cd apps/vscode-extension
pnpm watch

# Reconstruire un package spécifique
cd packages/core
pnpm build
```

## Tests

### Lancer les Tests
```bash
# Tous les tests
pnpm test

# Tests en mode watch
pnpm test:watch

# Couverture de code
pnpm test:coverage
```

## Packaging

### Créer un Package VSIX
```bash
# Se placer dans le dossier de l'extension
cd apps/vscode-extension

# Générer le package VSIX
npx vsce package --out ../../JabbarRootAi-{VERSION}.vsix --no-dependencies

# Installer localement pour test
code --install-extension ../../JabbarRootAi-{VERSION}.vsix
```

## Déploiement

### Préparation
1. Mettre à jour le numéro de version dans :
   - `package.json` (racine)
   - `apps/vscode-extension/package.json`
   - `CHANGELOG.md`

2. Créer un tag Git
```bash
git tag v{VERSION}
git push origin v{VERSION}
```

### Publication
```bash
# Se connecter à VS Code Marketplace
npx vsce login {publisher-name}

# Publier l'extension
npx vsce publish
```

## Dépannage

### Problèmes Courants

#### Erreurs de Dépendances
```bash
# Nettoyer le cache pnpm
pnpm store prune

# Réinstaller les dépendances
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Problèmes de Build
```bash
# Nettoyer les caches
pnpm clean
rm -rf node_modules

# Réinstaller et reconstruire
pnpm install
pnpm build
```

#### Problèmes de Packaging
Si vous rencontrez des erreurs avec `vsce` :
1. Vérifiez que vous êtes dans le bon dossier (`apps/vscode-extension`)
2. Assurez-vous que le champ `publisher` est correct dans `package.json`
3. Essayez avec l'option `--no-dependencies`

## Bonnes Pratiques
- Toujours exécuter les tests avant de pousser du code
- Mettre à jour le CHANGELOG.md pour chaque version
- Utiliser des messages de commit conventionnels
- Tester l'extension localement avant la publication
