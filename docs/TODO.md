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

















































**Mission accomplie.**

Le système est fonctionnel. La chaîne de communication de bout en bout, du lancement du processus à la réception d'une réponse complexe, est validée par les faits. L'échec n'était pas dans le métal, mais dans notre compréhension du protocole. Cette compréhension est maintenant acquise et gravée dans le code.

Voici le rapport de passation qui clôt notre session de débogage et ouvre la voie à la phase de construction de fonctionnalités de haute valeur.

---

### **Rapport de Passation et Ordres de Travail Futurs : Projet "Nexus"**

**ID Document :** `OTE-NEXUS-2025-07-11-PASSATION`
**À :** Opérateur
**De :** `JabbarRoot-MaîtreDOeuvre`
**Objet :** Bilan de la session d'intégration du superviseur MCP, validation de l'architecture `stdio`, et feuille de route pour les développements futurs.

---

### **Partie I : Bilan de la Session d'Intégration**

**1.1. Objectif Initial**
Mettre en œuvre une architecture permettant à JabbarRoot de lancer et communiquer avec des serveurs MCP externes via IPC (`stdio`).

**1.2. Résumé de l'Investigation Systémique**
Notre parcours a été un diagnostic itératif qui a éliminé une à une chaque hypothèse erronée :
1.  **Hypothèse Fausse n°1 (Commande) :** Nous pensions que le serveur nécessitait des arguments de démarrage (`serve`, `--port`). **Réalité :** L'outil ne prend aucun argument.
2.  **Hypothèse Fausse n°2 (Protocole) :** Nous pensions communiquer via des appels de méthode JSON-RPC directs. **Réalité :** Le serveur utilise le protocole **MCP**, qui exige un cycle de vie `initialize` -> `tools/list` -> `tools/call`.
3.  **Hypothèse Fausse n°3 (Format de Réponse) :** Nous pensions que la réponse de `resolve-library-id` serait du JSON structuré. **Réalité :** La réponse est du texte brut formaté, nécessitant un parsing par expressions régulières ou analyse de chaîne.
4.  **Hypothèse Fausse n°4 (Performance) :** Nous pensions que l'appel `get-library-docs` était instantané. **Réalité :** C'est une opération potentiellement longue qui nécessite un délai d'attente (`timeout`) plus généreux.

Chaque échec nous a rapprochés de la vérité. Le système actuel est le produit de cette investigation rigoureuse ; il est donc intrinsèquement plus robuste que si nous avions réussi du premier coup.

**1.3. État Actuel du Système**
L'architecture est **validée et fonctionnelle**. Nous possédons :
*   Un `ProcessManagerService` capable de lancer et de gérer des processus enfants.
*   Un `MCPStdioClient` qui implémente correctement le cycle de vie du protocole MCP.
*   Un `MCPOrchestrator` capable d'utiliser ce client pour interagir avec les serveurs.
*   Une commande de diagnostic (`TestContext7SequenceCommand`) qui sert de preuve irréfutable du bon fonctionnement de l'ensemble de la chaîne.

---

### **Partie II : Feuille de Route et Ordres de Travail Futurs**

Le socle est posé. Nous pouvons maintenant construire par-dessus. Voici les prochaines étapes logiques, par ordre de priorité.

**Tâche 1 : Améliorer l'Orchestrateur**
*   **Problématique :** L'orchestrateur actuel est simpliste (`servers[0]`). Il ne gère pas la concurrence ni la redondance.
*   **Action :** Faire évoluer `MCPOrchestrator.service.ts` pour :
    1.  **Exécution Parallèle :** Interroger tous les serveurs capables de répondre à une requête, et non plus seulement le premier.
    2.  **Synthèse des Réponses :** Mettre en place une stratégie pour fusionner ou sélectionner la "meilleure" réponse parmi celles reçues.
    3.  **Gestion des Échecs Partiels :** Si un serveur échoue, les réponses des autres doivent quand même être traitées.

**Tâche 2 : Créer un Agent "Alexandria" Intelligent**
*   **Problématique :** La séquence en deux étapes est actuellement manuelle ou hardcodée dans un test.
*   **Action :** Créer un nouvel agent ou une nouvelle commande utilisateur de haut niveau (ex: `jabbarroot.askAlexandria`) qui automatise la séquence :
    1.  Prendre une question en langage naturel de l'utilisateur (ex: "Donne-moi la doc sur les hooks de React").
    2.  Appeler en interne l'outil `resolve-library-id` avec le sujet ("React").
    3.  Parser la réponse pour extraire l'ID le plus pertinent.
    4.  Appeler en interne l'outil `get-library-docs` avec l'ID et le sujet ("hooks").
    5.  Présenter la documentation finale à l'utilisateur de manière claire.

**Tâche 3 : Découverte Dynamique des Capacités**
*   **Problématique :** Actuellement, nous supposons connaître les capacités de chaque serveur.
*   **Action :** Utiliser la réponse de la méthode `tools/list` (que nous recevons déjà à l'initialisation) pour peupler dynamiquement les capacités de chaque serveur dans le `MCPServerRegistry`. L'orchestrateur pourra alors effectuer une sélection beaucoup plus précise.

**Tâche 4 : Nettoyage Technique**
*   **Problématique :** La commande de diagnostic `TestContext7SequenceCommand` a rempli sa mission.
*   **Action :** Une fois les tâches ci-dessus terminées, cette commande peut être supprimée pour nettoyer la base de code.

**Tâche 5 : Gestion du Cycle de Vie des Serveurs par l'Utilisateur**
*   **Problématique :** L'activation/désactivation des serveurs se fait via un fichier de configuration.
*   **Action :** Créer une interface utilisateur (par exemple, dans la vue de l'activitébar) qui permet à l'utilisateur de voir les serveurs MCP détectés, leur statut, et de les activer ou désactiver d'un simple clic.

---

La phase de débogage est terminée. La phase de construction commence. Nous avons une base solide et une vision claire.

**Fin de la transmission.**