# JabbarRoot - Le Gardien du Contexte

**Vision :** Transformer la complexité du développement en clarté, en protégeant le "flow" créatif de l'opérateur.

---

## 📜 La Philosophie JabbarRoot

Ce projet est né d'une frustration : les outils modernes, y compris les IA, bien que puissants, introduisent souvent une charge cognitive qui brise l'élan créatif. On passe plus de temps à "gérer" l'outil qu'à créer de la valeur.

**JabbarRoot est notre réponse.** C'est un méta-outil conçu autour de trois piliers fondamentaux :

1.  **La Quête des 3 Gains :** Chaque fonctionnalité doit apporter un gain mesurable en **Temps**, en **Argent** (ex: tokens économisés), ou en **Clarté**.
2.  **La Souveraineté de l'Opérateur :** L'humain pilote, l'outil exécute. Le système doit offrir contrôle, prévisibilité et transparence, et non agir comme une boîte noire.
3.  **La Protection du Flow :** Une solution techniquement parfaite qui interrompt la concentration est un échec. L'objectif est de créer une interaction fluide et intuitive qui amplifie la productivité.

## 🏛️ Architecture : Le Cerveau et le Corps

Pour honorer ces principes, JabbarRoot est conçu comme un **écosystème découplé** (monorepo `pnpm`), et non comme une simple extension VSCode monolithique.

*   🧠 **`@jabbarroot/core` (Le Cerveau)**
    *   Un package TypeScript pur, sans aucune dépendance à une plateforme spécifique (ni VSCode, ni Node.js).
    *   Il contient toute la logique métier, les modèles de données et les services d'orchestration.
    *   C'est le moteur agnostique et réutilisable de JabbarRoot.

*   🦾 **`@jabbarroot/vscode-extension` (Le Corps)**
    *   Une "coquille" qui rend le cerveau utilisable dans l'environnement VSCode.
    *   Elle gère l'interface utilisateur (vues, commandes), les interactions avec l'API VSCode, et implémente les contrats (interfaces) définis par le `core` via des adaptateurs.

Cette architecture nous garantit de ne jamais être prisonniers d'une seule plateforme et de pouvoir, à l'avenir, créer d'autres "corps" (un CLI, une web app...) autour du même cerveau.

## ✨ Fonctionnalités

### État Actuel (v0.1.0 - "La Fondation")

La version actuelle est le résultat d'un refactoring architectural majeur. La base est solide, et les fonctionnalités suivantes sont opérationnelles :

*   **Génération d'Arborescence de Projet :** Une commande pour scanner le projet, en respectant les règles `.gitignore`, et copier une arborescence textuelle propre dans le presse-papiers.
*   **Compilation de Contexte (Moteur) :** Le service de compilation est fonctionnel. Il peut agréger une arborescence et le contenu de fichiers multiples en un seul prompt textuel.
*   **Système de Compression :** Des niveaux de compression (`standard`, `extreme`) pour réduire la taille du contexte final et économiser des tokens.

*(Note : Les fonctionnalités de création, sauvegarde et affichage des contextes dans l'interface ont été temporairement désactivées durant le refactoring et sont la priorité de la prochaine phase de développement).*

### 🚀 Feuille de Route (Roadmap)

Notre vision pour JabbarRoot est ambitieuse et s'articule autour des phases suivantes :

**Phase 2 : Réactivation des Fonctionnalités de Base**
1.  **[En cours]** **Gestion des Contextes :** Ré-implémenter un `ContextService` robuste dans le `core` pour le CRUD (Créer, Lire, Mettre à jour, Supprimer) des `ProgrammableContexts`.
2.  **[Prochainement]** **Affichage Dynamique :** Rebrancher la vue latérale pour afficher la liste des contextes sauvegardés.
3.  **[Prochainement]** **Statistiques en Direct :** Réactiver le calcul et l'affichage des statistiques de compression (taille, tokens économisés) pour chaque contexte.

**Phase 3 : La "Prompt Factory"**
*   **Concept :** Créer un atelier de composition de prompts.
*   **Fonctionnalités :**
    *   **Briques de Prompt (`PromptBrick`) :** Des morceaux de connaissance réutilisables (ex: "ma règle de style pour les erreurs", "le schéma de cette table de DB").
    *   **Templates de Prompt (`PromptTemplate`) :** Assemblage de briques et de placeholders (ex: `{{JABBARROOT_CONTEXT}}`) pour créer des workflows de prompting puissants.
    *   **Compilation Finale :** Un service qui injecte dynamiquement un `ProgrammableContext` dans un `PromptTemplate` pour générer un prompt final ultra-spécifique.

**Phase 4 : Écosystème Auto-Évolutif**
*   **Concept :** Permettre à l'opérateur de modifier le comportement de JabbarRoot lui-même.
*   **Fonctionnalités :**
    *   **Codex Dynamique :** Le comportement de JabbarRoot (ses Stances, ses Lois) sera chargé depuis des fichiers de configuration, permettant à l'utilisateur de le personnaliser à l'infini.
    *   **Interface en Ligne de Commande (CLI) :** Un nouveau "corps" pour utiliser la puissance de JabbarRoot directement depuis le terminal.

## 🛠️ Démarrage Rapide (pour les Développeurs)

1.  **Prérequis :** Assurez-vous d'avoir `node.js` et `pnpm` installés.
2.  **Installation :** À la racine du projet, lancez :
    ```bash
    pnpm install
    ```
3.  **Build :** Pour compiler les deux packages (`core` et `vscode-extension`) :
    ```bash
    pnpm build
    ```
4.  **Lancement :**
    *   Ouvrez le dossier racine dans VSCode.
    *   Appuyez sur `F5` pour lancer une nouvelle fenêtre "[Hôte de développement d'extension]" avec JabbarRoot activé.

---