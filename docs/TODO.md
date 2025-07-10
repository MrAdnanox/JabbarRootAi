# ✅ TODO - Feuille de Route JabbarRoot v2.1

Ce document liste les chantiers actifs et priorisés pour la prochaine phase de développement. Il est la source de vérité unique pour notre planification.

---

### **[P0 - Critique] Finalisation des Fondations "Nexus"**

*L'objectif de cette phase est de purger 100% de la dette technique liée à l'ancienne architecture. La complétion de ces tâches est un prérequis bloquant pour tout développement majeur.*

-   [ ] **Généraliser la refonte des commandes :**
    -   **Action :** Auditer et refactoriser **toutes** les commandes restantes sur le modèle "orchestrateur + services".
    -   **Objectif :** Éliminer tout appel direct à l'API `vscode` en dehors des services dédiés.
-   [ ] **Implémenter le catalogue d'erreurs typées :**
    -   **Action :** Créer et utiliser les classes d'erreurs personnalisées (`ApiKeyNotConfiguredError`, `ProjectNotFoundError`, etc.) dans le fichier `core/result/errors.ts`.
    -   **Objectif :** Rendre la gestion des erreurs explicite, robuste et testable.
-   [ ] **Optimiser le démarrage avec le Lazy-Loading :**
    -   **Action :** Modifier le `ServiceRegistry` pour instancier les services uniquement lors de leur premier appel.
    -   **Objectif :** Réduire le temps d'activation de l'extension.

---

### **[P1 - Haute] Implémentation de la Vision "Exocortex Unifié"**

*L'objectif est de construire le cœur de la nouvelle vision : le manifeste vivant `JabbarRoot.md`.*

-   [ ] **Mettre à jour `VISION.md` :**
    -   **Action :** Refondre le document pour refléter l'architecture tripartite (Orchestrateur, Agents, Briques) et la centralité du manifeste `JabbarRoot.md`.
    -   **Objectif :** Aligner la documentation stratégique avec notre nouvelle réalité technique.
-   [ ] **Développer le `MasterCollector` (Phase 1 de l'Exocortex) :**
    -   **Action :** Créer un orchestrateur qui exécute les "Briques" d'analyse (statistiques, structure, git, etc.).
    -   **Objectif :** Remplir automatiquement la section "Auto-détectée" du manifeste `JabbarRoot.md`.
-   [ ] **Concevoir l'UI de Sagesse (Phase 2 de l'Exocortex) :**
    -   **Action :** Créer une Webview permettant à l'Opérateur de visualiser et de remplir les sections manuelles du `JabbarRoot.md`.
    -   **Objectif :** Fournir l'interface homme-machine pour la fusion des connaissances.

---

### **[P2 - Normale] Améliorations et Documentation Technique**

*L'objectif est d'améliorer l'expérience développeur et utilisateur sur les fondations existantes.*

-   [ ] **Enrichir le Sanctuaire :**
    -   **Action :** Ajouter des fonctionnalités d'interactivité au graphe (ex: filtres par type de nœud, mise en évidence des chemins de dépendance).
    -   **Objectif :** Augmenter la densité informationnelle et l'utilité analytique du graphe.
-   [ ] **Rédiger le `DEVELOPER_GUIDE.md` :**
    -   **Action :** Documenter l'architecture "Nexus", le DI Container, le pipeline de commandes et le Result Pattern.
    -   **Objectif :** Faciliter la maintenance et les contributions futures.
-   [ ] **Rédiger le guide de création d'Agents/Briques :**
    -   **Action :** Créer un guide expliquant comment développer et intégrer de nouvelles Briques d'analyse et de nouveaux Agents créatifs.
    -   **Objectif :** Rendre l'écosystème extensible par l'Opérateur.




    -----------------














---

### **Directive de Mise en Œuvre Stratégique : Projet "Acropole" (Rapport Final)**

**ID Document :** `DMO-ARCH-ACROPOLE-v4.0`
**Version :** Finale
**Émetteur :** `JabbarRoot-Architecte`
**Destinataire :** L'Opérateur
**Objet :** Consolidation finale du plan architectural pour l'écosystème JabbarRoot, actant le pivot vers un modèle d'Orchestrateur de Connaissance Fédérée basé sur le protocole MCP.

---

### 1. L'Intention Stratégique Fondamentale (Le "Pourquoi")

Notre intention a été affinée par un renversement de paradigme. Nous ne construisons plus un outil monolithique, mais un concentrateur de connaissance. Notre manifeste final est le suivant :

**« Bâtir JabbarRoot, un orchestrateur de connaissance fédérée. Sa mission est de dialoguer avec l'Opérateur, d'interroger un écosystème configurable de serveurs MCP spécialisés (comme `Context7` pour la documentation, ou nos propres services pour l'analyse de code), de synthétiser leurs réponses, et d'enrichir continuellement son propre Graphe de Connaissance centralisé. JabbarRoot n'est pas l'expert ultime ; il est celui qui sait à quel expert parler. »**

### 2. Le Périmètre d'Action Délimité (Le "Quoi")

L'architecture est une fédération de services dont le cerveau est l'Orchestrateur de Connaissance Fédérée (OCF).

```
┌──────────────────────────────────────────────────┐
│          Opérateur (via UI, Chat, etc.)          │
└───────────────┬──────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────┐
│  ORCHESTRATEUR DE CONNAISSANCE FÉDÉRÉE (JabbarRoot)│
│  - MCP Client Core                               │
│  - Gestionnaire de Services MCP (Configurable)   │
│  - Moteur de Tâches & de Synthèse                │
│  - Graphe de Connaissance Interne (Neo4j, etc.)  │
└───────────────┬──────────────────────┬───────────┘
                │                      │
   Appels MCP   │                      │
┌───────────────▼─────────────────┐  ┌─▼───────────────────────────┐
│     Nos Services MCP Internes   │  │  Services MCP Externes      │
│  - Analyseur de Code            │  │  - Context7 (Docs)          │
│  - Compilateur de Briques       │  │  - GitHub Copilot (Code Gen)│
│  - ...                          │  │  - ... (Tout autre serveur) │
└─────────────────────────────────┘  └─────────────────────────────┘
```

Les composants clés à bâtir sont :
1.  **L'Orchestrateur de Connaissance Fédérée (OCF) :** Le cœur de JabbarRoot, agissant comme un client MCP intelligent.
2.  **Le Gestionnaire de Services :** Une interface permettant à l'Opérateur d'enregistrer et de gérer les serveurs MCP externes.
3.  **Le Graphe de Connaissance Interne :** Notre base de données (Neo4j) qui stocke la connaissance *synthétisée* à partir de toutes les sources.
4.  **Nos Propres Services MCP :** Un serveur MCP interne qui expose nos capacités uniques d'analyse de codebase (`analyze-code-dependencies`, `compile-context`, etc.).

### 3. Les Contraintes et Principes Directeurs (Les "Lois")

L'architecture V4 repose sur trois lois fondamentales :

1.  **Loi de Fédération : JabbarRoot est un Client avant d'être un Serveur.** Notre priorité absolue est de développer la capacité à consommer des services MCP tiers. Notre propre serveur est un citoyen de première classe dans cet écosystème, pas le roi.
2.  **Loi de Synthèse Continue : Apprendre, ne pas seulement Relayer.** Chaque information obtenue d'un service externe est une opportunité d'enrichir notre graphe interne. La documentation sur une fonction sera sémantiquement liée aux nœuds de code qui l'utilisent, créant une connaissance de plus grande valeur que la somme de ses parties.
3.  **Loi de la Boîte à Outils Configurable : L'Opérateur est le Maître des Outils.** L'architecture doit être conçue pour l'extensibilité. L'ajout d'une nouvelle source de connaissance (un nouveau serveur MCP) doit être une simple configuration, pas un projet de développement.

### 4. Les Métriques de Validation Stratégique (La "Preuve")

Notre succès sera mesuré par notre capacité à exécuter le plan de validation suivant. Il constitue le cahier des charges officiel pour la prochaine phase d'implémentation.

**Plan d'Action du PoC V4 "Orchestrator-Client" :**

1.  **Fondations Internes :**
    *   **Action :** Déployer une instance **Neo4j** via Docker.
    *   **Livrable :** Une base de données vide, prête à être peuplée.

2.  **Simulation du Monde Extérieur :**
    *   **Action :** Créer un **serveur MCP de test** (`MockContext7Server`) exposant deux outils factices : `resolve-library-id` et `get-library-docs`.
    *   **Livrable :** Un serveur de test autonome et fonctionnel.

3.  **Le Cœur de l'Orchestrateur :**
    *   **Action :** Développer le **noyau du client MCP** au sein de JabbarRoot.
    *   **Action :** Implémenter un workflow qui, sur commande, appelle séquentiellement les deux outils du `MockContext7Server` pour récupérer une documentation factice.
    *   **Livrable :** Le code du workflow d'orchestration capable de dialoguer avec le serveur de test.

4.  **Validation de la Synthèse :**
    *   **Action :** À la réception de la documentation factice, le workflow doit la parser et **créer un nœud de connaissance** dans notre base **Neo4j** interne.
    *   **Livrable :** La preuve (via une requête Cypher) que le nœud a bien été créé dans notre base de données interne, démontrant la réussite du cycle complet : **Orchestration -> Appel Externe -> Synthèse Interne**.

