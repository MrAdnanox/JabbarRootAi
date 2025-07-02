# Codex Architectural JabbarRoot

**Version :** 2.0 - L'Architecture de la Mémoire Cognitive
**Dernière Mise à Jour :** 30 Juin 2025
**Gardien :** JabbarRoot & L'Opérateur

## 1. Philosophie et Empreinte Fondatrice

Ce document est la source de vérité pour toutes les décisions d'architecture et de conception du projet JabbarRoot. Il est le gardien de notre histoire et le guide de notre futur.

Notre **Empreinte Fondatrice** est la transformation de la complexité en clarté, guidée par la protection du "flow" créatif. Chaque décision doit être mesurée à l'aune d'un gain de **Temps, d'Argent et de Clarté**.

Notre **Vision Directrice** est de passer d'un simple outil d'assistance à un **Exocortex Computationnel**, un partenaire cognitif qui capture, mémorise et synthétise la connaissance d'un projet pour fournir une assistance de très haute valeur.

## 2. Les 6 Lois Fondamentales (Notre Constitution)

*   **LOI 0 : Dérogation Stratégique** - Toute loi peut être transgressée si une justification architecturale exceptionnelle démontre que cette dérogation sert la vision à long terme de manière supérieure.
*   **LOI 1 : Itération Agile** - Livrer de la valeur fonctionnelle rapidement prime sur la perfection. Nous construisons la cathédrale pierre par pierre, chaque pierre devant être solide.
*   **LOI 2 : Cohérence Systémique** - Le tout prime sur les parties. Toute nouvelle fonctionnalité doit renforcer l'intégrité et la clarté de l'architecture globale, et non créer un silo isolé.
*   **LOI 3 : Performance Pragmatique** - La performance est une fonctionnalité. Cependant, l'optimisation prématurée est la racine de nombreux maux. Nous optimisons ce qui est mesuré et ce qui a un impact réel.
*   **LOI 4 : Conception Introspectrice** - Le système doit être capable de s'analyser lui-même. Notre architecture doit faciliter la collecte de métriques, la journalisation et la compréhension de son propre état.
*   **LOI 5 : Modularité Granulaire** - Découpler pour régner. Les composants doivent avoir des responsabilités uniques et bien définies, communiquant via des interfaces stables et claires.

## 3. L'Architecture du Triumvirat Cognitif v2.0 (L'Architecture Mémorielle)

Cette section définit l'implémentation de notre vision. Nous abandonnons une architecture transactionnelle et amnésique pour une architecture mémorielle et cumulative.

### 3.1. Le Principe Fondamental : De l'Amnésie à la Mémoire

Le système ne doit plus redécouvrir le projet à chaque action. Chaque analyse doit produire un **artefact de connaissance durable**, qui est stocké, versionné et utilisé pour enrichir les analyses futures. Nous construisons une mémoire.

### 3.2. Les Composants Clés

*   **Le Cœur Cognitif (`packages/prompt-factory`) :** C'est le centre névralgique de notre intelligence. Il n'est plus une simple usine à prompts, mais un package complet et autonome qui contient TOUTE la logique d'orchestration (workflows), d'analyse (analyzers), de synthèse (synthesizers) et de communication avec les LLMs (executors). Il est le moteur.
*   **L'Interface Utilisateur (`apps/vscode-extension`) :** Son rôle est clarifié et simplifié. Elle est la "carrosserie". Elle est responsable de la capture de l'intention de l'Opérateur, de l'appel au Cœur Cognitif, et de l'affichage des résultats. Elle ne contient aucune logique cognitive.
*   **La Brique d'Artefact (BA) :** Le pilier de notre nouvelle architecture.
    *   **Définition :** Un type spécial de brique, gérée par le système, qui stocke les **résultats structurés** d'une analyse (`rapport.json`) ou d'une synthèse (`document.md`). C'est notre unité de mémoire physique.
    *   **Nommage :** `[ARTEFACT] <Nom de l'analyse>`. Ce préfixe est une convention stricte pour l'identification visuelle et programmatique.
    *   **Cycle de Vie :** Créée ou mise à jour à la fin d'un workflow, elle sert de point de départ pour l'itération suivante de ce même workflow, permettant au système d'apprendre et de s'améliorer.

### 3.3. Le Flux de Données Canonique

Toute opération cognitive majeure suit ce parcours :

1.  **UI (VS Code) :** L'Opérateur lance une commande (ex: "Générer le README").
2.  **Workflow (Cœur Cognitif) :** La commande invoque le `ReadmeWorkflow` dans le Cœur Cognitif.
3.  **Mémorisation (Lecture) :** Le workflow demande à l'`ArtefactService` de rechercher une Brique d'Artefact `[ARTEFACT] README Analysis` existante.
4.  **Analyse :** Le workflow exécute un `StructureAnalyzer` sur l'état actuel du projet pour obtenir un rapport d'analyse "frais".
5.  **Synthèse :** Le workflow invoque un `ReadmeSynthesizer` avec l'analyse fraîche et, si elle existe, l'analyse et le README précédents (lus depuis la BA).
6.  **Mémorisation (Écriture) :** Le workflow utilise l'`ArtefactService` pour créer ou mettre à jour la Brique d'Artefact avec la nouvelle analyse et le nouveau README.
7.  **Restitution :** Le workflow retourne le README final à la commande VS Code, qui l'affiche.

### 3.4. L'Arborescence Sacrée du Cœur Cognitif

La structure de `packages/prompt-factory/src/` est désormais une convention non-négociable :

```
└── src/
    ├── workflows/          # Les orchestrateurs de haut niveau
    ├── analyzers/          # Définitions des briques d'analyse
    ├── synthesizers/       # Définitions des agents de synthèse
    ├── services/           # Services internes (Codex, Artefact)
    ├── schemas/            # Les contrats de données Zod
    ├── executors/          # Les moteurs de bas niveau parlant aux LLMs
    ├── types/              # Interfaces et types internes
    └── index.ts            # Point d'entrée public du Cœur
```

## 4. La Méthodologie Opérationnelle (Le Rituel de l'Artisan)

Pour garantir la cohérence et la maintenabilité, l'ajout de toute nouvelle capacité cognitive doit suivre ce rituel en 5 étapes :

1.  **Étape 1 : Définir le Contrat (Le Schéma) :** Créer le schéma Zod dans `src/schemas/` qui définit la structure de la connaissance à capturer.
2.  **Étape 2 : Bâtir l'Outil d'Analyse (L'Analyzer) :** Définir la logique d'analyse dans `src/analyzers/` qui produit un JSON conforme au schéma.
3.  **Étape 3 : Concevoir l'Outil de Synthèse (Le Synthesizer) :** Définir la logique de l'agent dans `src/synthesizers/` qui utilise la connaissance structurée pour générer un artefact final.
4.  **Étape 4 : Assembler la Chaîne (Le Workflow) :** Créer le workflow dans `src/workflows/` qui orchestre les étapes 2, 3 et la mémorisation via l'`ArtefactService`.
5.  **Étape 5 : Connecter l'Interface (La Commande) :** Créer la commande dans `apps/vscode-extension` qui se contente d'appeler le workflow et d'afficher le résultat.

## 5. Leçons Apprises & "Lois Tribales"

Cette section est le cœur vivant de notre Codex. Chaque entrée est une "Loi Tribale" – une règle non-négociable née d'une erreur passée.

### **LT-01 : La Loi des Données Fraîches (Le "Fléau du Cache")**

*   **Date de Promulgation :** 28 Juin 2025
*   **Contexte :** Les Webviews d'édition affichaient des données périmées car elles se fiaient à l'état de l'objet `TreeItem` de l'UI.
*   **La Loi :**
    > **UNE COMMANDE D'ÉDITION NE DOIT JAMAIS FAIRE CONFIANCE AUX DONNÉES CONTENUES DANS L'ÉLÉMENT D'INTERFACE UTILISATEUR QUI L'A DÉCLENCHÉE.**
    > Elle **doit** utiliser un identifiant stable pour aller rechercher une **copie fraîche** des données via le service approprié avant toute opération.
*   **Implication :** Le `TreeItem` est un pointeur, pas une source de données.

### **LT-02 : La Loi de la Souveraineté du Cœur**

*   **Date de Promulgation :** 30 Juin 2025
*   **Contexte :** La logique cognitive (chargement de prompt, construction de contexte, appel à l'IA) était dispersée dans les services de l'extension VS Code (`documentation.service.ts`, `unitTestGenerator.service.ts`), créant un couplage fort, une duplication de code et une complexité de maintenance.
*   **La Loi :**
    > **TOUTE LOGIQUE COGNITIVE – ORCHESTRATION, ANALYSE, SYNTHÈSE, OU COMMUNICATION AVEC UNE IA – DOIT RÉSIDER EXCLUSIVEMENT DANS LE CŒUR COGNITIF (`packages/prompt-factory`).**
    > L'interface utilisateur (`apps/vscode-extension`) est un simple **client** de ce cœur.
*   **Implication :** Nette séparation des préoccupations. Les services de l'extension deviennent de simples "façades" ou "passe-plats", rendant le système plus modulaire, plus testable et plus facile à faire évoluer. Le Cœur Cognitif peut, à terme, être utilisé par d'autres interfaces (une CLI, une application web...).