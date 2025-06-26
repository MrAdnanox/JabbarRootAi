# Commandes jabbarroot

Ce document répertorie toutes les commandes essentielles pour le développement, le test et le déploiement de l'extension jabbarroot.

## Développement

### Installation des dépendances
```bash
npm install
```

### Compilation
Compiler le code TypeScript :
```bash
npm run compile
```

### Exécution en mode développement
Lancer l'extension dans une nouvelle fenêtre VS Code :
```bash
npm run watch
```

## Tests

### Lancer les tests
```bash
npm test
```

### Lancer les tests en mode watch
```bash
npm run test:watch
```

### Lancer les tests avec couverture
```bash
npm run test:coverage
```

## Construction et déploiement

### Générer le package VSIX
```bash
npx vsce package
```

### Installer l'extension localement
```bash
code --install-extension jabbarroot-0.0.1.vsix
```

### Publier sur le Marketplace (nécessite un token d'accès)
```bash
npx vsce publish
```

## Utilitaires

### Nettoyage
Supprimer les dossiers de build et les dépendances :
```bash
npm run clean
```

### Vérification du code
Lancer ESLint :
```bash
npm run lint
```

### Correction automatique ESLint
```bash
npm run lint:fix
```

## Débogage

### Lancer le débogueur VS Code
Appuyez sur `F5` dans VS Code pour lancer une session de débogage.

### Inspecter les tests
Pour déboguer les tests, utilisez la configuration "Run Extension Tests" dans VS Code.
