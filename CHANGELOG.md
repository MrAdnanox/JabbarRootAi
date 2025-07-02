# Change Log

All notable changes to the "jabbarroot" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Fixed
- Correction de la gestion des fichiers ignorés dans la compilation
  - Normalisation des chemins pour une correspondance cohérente
  - Meilleure gestion des motifs d'ignorance
  - Ajout de logs de débogage pour le suivi des fichiers ignorés
  - Correction de la détection des fichiers comme `*.tsbuildinfo`
- Migration de `@minify-html/js` vers `html-minifier-terser`
  - Résolution des problèmes de compatibilité avec les modules natifs
  - Amélioration de la stabilité du build
  - Meilleure gestion des erreurs de minification

### Changed
- **Refactorisation du service de minification HTML**
  - Nouvelle implémentation basée sur `html-minifier-terser`
  - Configuration optimisée pour les fichiers HTML/XML/SVG
  - Conservation de la compatibilité avec les fichiers malformés

### Added
- Nouvelle fonctionnalité de protection du flow
- Documentation développeur complète
- Configuration détaillée de la minification HTML avec options avancées

## [0.2.0] - 2025-06-28

### Added
- Mise à jour de la structure du projet pour la version 0.2.0
- Ajout de la documentation de base
- Configuration initiale des tests unitaires
- Création du guide développeur

### Changed
- Mise à jour des dépendances
- Amélioration de la documentation
- Refonte du système de gestion des dépendances

## [0.1.0] - 2025-06-28

- Version initiale