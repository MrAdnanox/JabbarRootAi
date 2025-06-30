Absolument, Opérateur. C'est l'étape la plus cruciale. Une vision, aussi claire soit-elle, reste une nébuleuse sans une structure pour l'incarner. Il est temps de dessiner les plans de notre cathédrale, de définir le langage de nos artisans et de graver les rituels de notre guilde.

Nous allons maintenant transformer nos concepts en une architecture tangible, une arborescence de fichiers sans ambiguïté et une méthodologie unifiée. Ceci est la charte fondatrice de notre nouvelle ère.

---

### **Directive d'Architecture et de Méthodologie : Le Triumvirat Cognitif v3.0**

#### 1. L'Intention Stratégique Fondamentale : La Structure au service de la Mémoire

Notre "Pourquoi" est de bâtir un système où la connaissance n'est pas volatile mais cumulative. Pour ce faire, notre structure de projet doit refléter cette philosophie. Le package `packages/prompt-factory` cesse d'être une simple collection d'exécuteurs pour devenir le **Cœur Cognitif** de l'écosystème, orchestrant l'analyse, la mémorisation et la synthèse. L'extension VS Code redevient une simple **Interface Utilisateur Intelligente**.

#### 2. L'Architecture Unifiée : Structure, Conventions et Flux

##### **2.1. Le Flux de Données Canonique**

Toute opération cognitive suivra désormais ce parcours sacré :

1.  **Interface (VS Code)** : L'Opérateur initie une commande.
2.  **Service (VS Code)** : Le service correspondant prépare le **contexte initial** (ID du projet, clé API, etc.) et invoque un **Workflow** dans le Cœur Cognitif.
3.  **Orchestrateur (Workflow dans `prompt-factory`)** : Le Workflow prend le contrôle. Il orchestre l'exécution des Briques et des Agents.
4.  **Analyse (Briques d'Analyse)** : Les Briques transforment le code brut en **JSON structuré**.
5.  **Mémorisation (Service d'Artefact)** : Le résultat de l'analyse est persisté dans une **Brique d'Artefact (BA)**.
6.  **Synthèse (Agents)** : Les Agents lisent une ou plusieurs BA pour produire un **artefact final** (Markdown, code, etc.).
7.  **Restitution (VS Code)** : Le Workflow retourne l'artefact final au Service VS Code, qui l'affiche à l'Opérateur.

##### **2.2. L'Arborescence Cible du Cœur Cognitif (`packages/prompt-factory`)**

Cette structure est notre nouvelle loi. Elle favorise la clarté et la séparation des préoccupations.

```
packages/prompt-factory/
└── src/
    ├── workflows/          # NOUVEAU: Les orchestrateurs de haut niveau (PIVOT CENTRAL)
    │   ├── IWorkflow.ts
    │   └── readme.workflow.ts
    ├── analyzers/          # NOUVEAU: Définitions des briques d'analyse
    │   ├── IAnalyzer.ts
    │   └── structure.analyzer.ts
    ├── synthesizers/       # NOUVEAU: Définitions des agents de synthèse
    │   ├── ISynthesizer.ts
    │   └── readme.synthesizer.ts
    ├── services/           # Services internes au Cœur Cognitif
    │   ├── Codex.service.ts      # Lit les prompts depuis .jabbarroot/
    │   └── Artefact.service.ts   # Gère la lecture/écriture des Briques d'Artefact
    ├── schemas/            # Les contrats de données Zod, source de vérité
    │   └── ArchitecturalReport.schema.ts
    ├── executors/          # Les moteurs de bas niveau parlant aux LLMs
    │   ├── GenericAgent.executor.ts
    │   └── StructureDecoder.executor.ts
    ├── types/              # Types et interfaces spécifiques au Cœur Cognitif
    │   └── artefact.types.ts
    └── index.ts            # Exporte uniquement les éléments publics (Workflows, Services)
```

##### **2.3. Les Conventions Unifiées (Notre Langage Commun)**

*   **Nommage de Fichiers :** `[feature].[type].ts`. Exemples : `readme.workflow.ts`, `git.analyzer.ts`, `ArchitecturalReport.schema.ts`. C'est clair, prédictible et regroupable.
*   **Nommage des Briques d'Artefact :** `[ARTEFACT] <Feature> Analysis`. Le préfixe est non-négociable. Il permet une identification programmatique et visuelle immédiate. Exemple : `[ARTEFACT] README Analysis`.
*   **Structure des Workflows :** Chaque workflow est une classe implémentant `IWorkflow` avec une méthode `execute(context: T): Promise<U>`. Ses étapes internes doivent être des méthodes privées claires (`step1_AnalyzeStructure`, `step2_UpdateArtefact`, etc.).
*   **Dépendances :** Seul le dossier `executors/` a le droit d'importer un SDK de LLM. Les autres modules dépendent des exécuteurs.

#### 3. La Méthodologie Opérationnelle Clarifiée

Pour ajouter une nouvelle capacité cognitive (par exemple, "Analyser les dépendances"), chaque artisan devra suivre ce rituel en 5 étapes. C'est notre méthodologie.

1.  **Étape 1 : Définir le Contrat (Le Schéma)**
    *   **Action :** Créer un fichier Zod dans `src/schemas/`.
    *   **Exemple :** `DependencyReport.schema.ts` qui définit la structure du rapport d'analyse des dépendances.
    *   **Principe :** On commence toujours par définir la structure de la connaissance que l'on veut capturer.

2.  **Étape 2 : Bâtir l'Outil d'Analyse (L'Analyzer)**
    *   **Action :** Créer la définition de la brique dans `src/analyzers/`.
    *   **Exemple :** `dependency.analyzer.ts` qui sait comment générer un `DependencyReport`.
    *   **Principe :** L'analyse est une tâche atomique qui transforme le chaos (code, fichiers) en ordre (JSON structuré).

3.  **Étape 3 : Concevoir l'Outil de Synthèse (Le Synthesizer)**
    *   **Action :** Créer le prompt de l'agent dans `.jabbarroot/prompt-factory/agents/` et sa définition dans `src/synthesizers/`.
    *   **Exemple :** `dependency-summary.agent.md` et `dependency.synthesizer.ts`.
    *   **Principe :** La synthèse s'appuie sur la connaissance structurée (le JSON de l'étape 1), pas sur les données brutes.

4.  **Étape 4 : Assembler la Chaîne de Production (Le Workflow)**
    *   **Action :** Créer le fichier d'orchestration dans `src/workflows/`.
    *   **Exemple :** `dependency.workflow.ts`.
    *   **Principe :** Le workflow est le "Maître d'Œuvre". Il appelle l'analyseur, sauvegarde le résultat via `ArtefactService`, puis appelle le synthétiseur avec l'artefact. Il ne contient pas de logique métier, seulement de la logique d'orchestration.

5.  **Étape 5 : Connecter à l'Interface (La Commande)**
    *   **Action :** Mettre à jour `extension.ts` et les fichiers de commande dans `apps/vscode-extension/src/commands/`.
    *   **Exemple :** `generateDependencyReport.command.ts`.
    *   **Principe :** La commande est "stupide". Elle collecte l'intention de l'Opérateur, appelle le workflow correspondant, attend le résultat et l'affiche. Toute la complexité est déléguée au Cœur Cognitif.

#### 4. Plan d'Action Séquentiel pour la Mise en Œuvre

1.  **Phase 1 : Refondation.** Réorganiser l'arborescence de `packages/prompt-factory` pour correspondre à la structure cible.
2.  **Phase 2 : Création des Piliers.** Implémenter les services centraux : `CodexService` et `ArtefactService`. `ArtefactService` utilisera `ProjectService` et `BrickService` sous le capot pour manipuler les Briques d'Artefact.
3.  **Phase 3 : Le Prototype Vertical.** Implémenter le premier workflow de bout en bout en suivant notre nouvelle méthodologie : le `ReadmeWorkflow`.
    *   Créer `ArchitecturalReport.schema.ts`.
    *   Créer `structure.analyzer.ts`.
    *   Créer `readme.synthesizer.ts`.
    *   Créer `readme.workflow.ts`.
4.  **Phase 4 : Intégration.** Refactoriser la commande `generateReadme.command.ts` pour qu'elle n'appelle plus que le `ReadmeWorkflow`.
5.  **Phase 5 : Finalisation UI.** Mettre à jour `ProjectTreeDataProvider` pour détecter et afficher différemment les Briques d'Artefact, complétant la boucle de feedback vers l'Opérateur.

---

Opérateur, ce document est notre nouvelle constitution. Il est le fruit de nos échanges, la cristallisation de votre vision. Il apporte l'ordre au chaos conceptuel. Chaque membre de notre Triumvirat a désormais un rôle, un emplacement et une méthode de travail clairs.

Nous sommes prêts à bâtir. La vision est claire, le plan est défini.