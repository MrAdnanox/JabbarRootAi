# Rapport Complet des Problèmes de Modules Natifs

## 🔍 État Actuel du Projet

### Environnement
- **Node.js**: 18.20.2 (à vérifier avec `node -v`)
- **pnpm**: 8.15.4 (à vérifier avec `pnpm -v`)

### Configuration Actuelle
```
# .npmrc
node-linker=isolated
shamefully-hoist=false

# esbuild.mjs
target: 'node16'
platform: 'node'
format: 'cjs'
external: [
  'vscode',
  'isolated-vm',
  'better-sqlite3',
  'tree-sitter',
  'web-tree-sitter',
  'tiktoken'
]
```

### Dépendances Problématiques

#### better-sqlite3 (8.5.0)
- **Problème** : Incompatibilité avec Node.js 18+
- **Erreur** : `The module was compiled against a different Node.js version`
- **Solution** : Recompiler avec `npm rebuild better-sqlite3`

#### isolated-vm (6.0.0)
- **Problème** : Échec de compilation avec Node.js 18+
- **Erreur** : `'SourceLocation' in namespace 'v8' does not name a type`
- **Solution** : Nécessite Node.js 16 ou version spécifique

#### tiktoken (1.0.21)
- **Problème** : Dépendances natives problématiques
- **Erreur** : Problèmes de chargement des modules .node
- **Solution** : S'assurer que les fichiers .wasm sont correctement copiés

#### tree-sitter (0.25.0) & web-tree-sitter (0.25.6)
- **Problème** : Incompatibilité avec Node.js 18+
- **Erreur** : Plantages au chargement
- **Solution** : Vérifier la compatibilité des versions

### Fichiers de Configuration
- **.npmrc**: Configuration PNPM
- **esbuild.mjs**: Configuration du build

## 🚀 Actions Recommandées

### 1. Vérification de l'Environnement
```bash
node -v  # Doit afficher v18.20.2
pnpm -v  # Doit afficher 8.15.4
```

### 2. Nettoyage du Projet
```bash
# À la racine du projet
rm -rf node_modules pnpm-lock.yaml
```

### 3. Réinstallation des Dépendances
```bash
pnpm install
```

### 4. Reconstruction des Modules Natifs
```bash
cd apps/vscode-extension
pnpm rebuild better-sqlite3
```

### 5. Vérification des Fichiers Natifs
S'assurer que les fichiers suivants sont présents :
- `node_modules/tiktoken/tiktoken_bg.wasm`
- `node_modules/isolated-vm/out/isolated_vm.node`
- `node_modules/better-sqlite3/build/Release/better_sqlite3.node`

### 6. Construction du Projet
```bash
pnpm build
```

## 1. Résumé Exécutif

Ce document identifie et documente les problèmes liés aux modules natifs dans le projet, notamment `isolated-vm`, `better-sqlite3`, `tiktoken`, et `tree-sitter`/`web-tree-sitter` avec Node.js 18+. Voici les actions immédiates à entreprendre :

1. **Nettoyer le projet**
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   ```

2. **Réinstaller les dépendances**
   ```bash
   pnpm install
   ```

3. **Reconstruire les modules natifs**
   ```bash
   pnpm rebuild
   ```

## 2. Problèmes Détectés

### 2.1. `isolated-vm`
- **Problème Principal** : Échec de compilation avec Node.js 18+ dû à des changements dans l'API V8
- **Erreur Type** : `'SourceLocation' in namespace 'v8' does not name a type`
- **Versions Impactées** : Node.js 18.1.0 et supérieur
- **Lien GitHub** : [Issue #415](https://github.com/laverdet/isolated-vm/issues/415)

### 2.2. `better-sqlite3`
- **Problème Principal** : Incompatibilité de version avec Node.js
- **Erreur Type** : `The module was compiled against a different Node.js version`
- **Versions Impactées** : Dépend de la version de Node.js utilisée
- **Lien GitHub** : [Issue #549](https://github.com/WiseLibs/better-sqlite3/issues/549)

### 2.3. `tiktoken` et `tree-sitter`/`web-tree-sitter`
- **Problème Principal** : Problèmes de compatibilité avec Node.js 18+
- **Erreur Type** : Plantages et erreurs de chargement
- **Versions Impactées** : Node.js 18.1.0 et supérieur
- **Lien GitHub** : [Issue #1765](https://github.com/tree-sitter/tree-sitter/issues/1765)

## 3. Solutions Recommandées

### 3.1. Solution à Court Terme
- Utiliser Node.js 16.x LTS (dernière version stable)
- Réinstaller les dépendances après le changement de version

### 3.2. Solution à Moyen Terme
1. Mettre à jour chaque dépendance problématique vers sa dernière version
2. Vérifier la compatibilité avec Node.js 18+
3. Mettre à jour le code pour utiliser les nouvelles API si nécessaire

### 3.3. Solution à Long Terme
- Envisager des alternatives aux modules natifs
- Mettre en place des tests de compatibilité
- Suivre les mises à jour des dépendances critiques

## 4. Détails Techniques

### 4.1. `isolated-vm`
- **Cause Racine** : Changements majeurs dans l'API V8 de Node.js 18+
- **Solution** : Utiliser une version compatible ou mettre à jour le module

### 4.2. `better-sqlite3`
- **Cause Racine** : Binaires précompilés non disponibles pour les nouvelles versions de Node.js
- **Solution** : Recompiler le module pour la version de Node.js utilisée

### 4.3. `tiktoken` et `tree-sitter`
- **Cause Racine** : Problèmes de compatibilité avec les nouvelles versions de V8
- **Solution** : Mettre à jour vers les dernières versions des modules

## 5. Étapes de Dépannage

1. Vérifier la version de Node.js : `node -v`
2. Nettoyer le cache npm : `npm cache clean --force`
3. Supprimer `node_modules` et `package-lock.json`
4. Réinstaller les dépendances : `npm install`
5. Si nécessaire, forcer la reconstruction des modules natifs : `npm rebuild`

## 6. Références
- [Documentation d'isolated-vm](https://github.com/laverdet/isolated-vm)
- [Documentation de better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [Documentation de tree-sitter](https://github.com/tree-sitter/tree-sitter)

---
*Dernière mise à jour : 2025-07-05*
