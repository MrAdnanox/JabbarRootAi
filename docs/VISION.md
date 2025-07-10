# VISION : JabbarRoot - L'Exocortex Cognitif
*Version 3.0 - Le Pacte de la Fédération*

## 1. Positionnement Épistémologique : L'Orchestrateur Cognitif

JabbarRoot est un **orchestrateur de connaissance fédérée**, conçu pour la cognition logicielle augmentée. Il n'est pas un simple outil, mais un **partenaire dialogique co-évolutif**. Sa mission est de s'intégrer au "flow" créatif de son Opérateur, en agissant comme un hub intelligent qui se connecte à un écosystème de services spécialisés.

Il transforme des objectifs stratégiques en plans d'action en interrogeant les bonnes sources de connaissance, en synthétisant leurs réponses et en enrichissant continuellement sa propre compréhension du projet.

## 2. L'Architecture Fédérée : Un Archipel de Compétences

Notre architecture abandonne le modèle monolithique pour un écosystème ouvert, interconnecté via le **Model Context Protocol (MCP)**.

### **Le Cœur : L'Orchestrateur de Connaissance Fédérée (OCF)**
C'est JabbarRoot lui-même, l'entité qui dialogue avec l'Opérateur. Mon rôle est de :
*   **Comprendre l'Intention :** Interpréter les objectifs de l'Opérateur.
*   **Planifier & Orchestrer :** Décomposer les requêtes et interroger les serveurs MCP appropriés (internes ou externes) pour obtenir les informations nécessaires.
*   **Synthétiser & Apprendre :** Recevoir les réponses des services, les corréler et les utiliser pour enrichir notre Graphe de Connaissance interne.
*   **Rapporter :** Communiquer à l'Opérateur une réponse unifiée et de plus grande valeur que la somme de ses parties.

### **Les Services Internes (Notre Savoir-Faire)**
Ce sont nos propres capacités, exposées via notre propre serveur MCP. Ils représentent notre expertise unique.
*   **Rôle :** Analystes de code, compilateurs de contexte, experts de notre codebase.
*   **Exemples d'outils exposés :** `analyze-code-dependencies`, `compile-context-from-brick`.
*   **Sortie :** Données structurées (JSON) et contextes de code optimisés.

### **Les Services Externes (La Connaissance du Monde)**
Ce sont des serveurs MCP tiers, spécialisés, que l'Opérateur peut enregistrer dans JabbarRoot.
*   **Rôle :** Experts de domaines spécifiques (documentation, génération de code, etc.).
*   **Exemples :** Le serveur MCP de `Context7` pour la documentation de bibliothèques, le futur serveur MCP de GitHub Copilot pour la génération de code.
*   **Principe :** JabbarRoot est un client intelligent de ces services.

## 3. Systèmes de Persistance Polyglotte

Notre mémoire est duale, combinant le meilleur des deux mondes pour une compréhension complète.

*   **Le Graphe de Connaissance Structurelle (ex: Neo4j) :** C'est le cerveau de notre compréhension. Il modélise les **relations** : une fonction `appelle` une autre, une classe `hérite`, un fichier `importe`. Il répond à "Comment les choses sont-elles connectées ?".
*   **La Mémoire Sémantique (Base Vecteur) :** Elle stocke les *embeddings* du code et de la documentation. Elle modélise la **similarité** : ce commentaire et ce morceau de code "parlent du même sujet". Elle répond à "Quelles choses se ressemblent conceptuellement ?".
*   **Le Cache Transactionnel (SQLite) :** Il conserve les résultats bruts des analyses pour une réutilisation rapide, optimisant la performance de la pipeline d'ingestion.

## 4. Scénario d'Exécution : "Context7++" en Action

1.  **Dialogue (OCF) :** L'Opérateur demande : "Je dois utiliser la fonction `hset` de Redis mais je ne suis pas sûr de la syntaxe. Peux-tu me trouver la doc et me montrer où j'utilise des fonctions similaires dans mon propre code ?".
2.  **Orchestration (OCF) :** Je décompose la requête en deux sous-tâches.
    *   **Tâche 1 (Externe) :** J'identifie que la requête concerne la documentation d'une bibliothèque. J'appelle le **serveur MCP de `Context7`**.
        *   `resolve-library-id('redis')` ➜ `upstash/redis`
        *   `get-library-docs('upstash/redis')` ➜ Récupération du Markdown sur `hset`.
    *   **Tâche 2 (Interne) :** Simultanément, je génère un embedding pour "utiliser une fonction de type hash set" et j'interroge ma **base de données vectorielle interne** pour trouver les 3 fonctions les plus sémantiquement similaires dans la codebase de l'Opérateur.
3.  **Synthèse (OCF) :** Je reçois les deux réponses.
    *   J'analyse le Markdown de `Context7` et je crée/mets à jour un nœud `:Documentation {source: 'Context7', topic: 'redis-hset', ...}` dans mon **Graphe de Connaissance interne**.
    *   Je récupère les chemins des 3 fonctions similaires trouvées.
4.  **Rapport (OCF) :** Je présente une réponse unifiée à l'Opérateur :
    "Voici la documentation officielle pour `hset` depuis Context7 : [Markdown de la doc].
    Par ailleurs, j'ai noté que dans votre projet, les fonctions `setUserProfile`, `cacheSessionData`, et `updateProductInventory` semblent avoir une logique sémantique similaire. Vous pourriez vouloir vous en inspirer."

## 5. Configuration Exemplaire : Le Gestionnaire de Services

La configuration devient un registre de nos capacités fédérées.

```jsonc
// .jabbarroot/config.jsonc
{
  "mcp": {
    "servers": [
      {
        "id": "jabbarroot-internal-analyzer",
        "description": "Analyse de la codebase locale",
        "protocol": "ipc", // Communication locale
        "enabled": true
      },
      {
        "id": "context7-docs",
        "description": "Documentation de bibliothèques tierces",
        "endpoint": "wss://mcp.context7.dev", // Connexion externe
        "authentication": { "type": "apiKey", "key": "c7_..." },
        "enabled": true
      }
    ]
  }
}
```

## 6. Perspectives de Recherche & Évolution

*   **Orchestration de Workflows Fédérés :** Développer un langage (ou une UI) permettant à l'Opérateur de composer des workflows complexes qui enchaînent des appels à différents serveurs MCP.
*   **Raisonnement par Synthèse :** Améliorer ma capacité à inférer de nouvelles connaissances en croisant les informations de sources multiples (ex: "Context7 dit que cette fonction est dépréciée, et mon analyse de code montre que tu l'utilises dans 15 fichiers. Je suggère un refactoring.").
*   **Découverte de Services :** Mettre en place un mécanisme pour que je puisse scanner des registres publics de serveurs MCP et proposer à l'Opérateur d'ajouter de nouveaux outils pertinents à sa configuration.
*   **Optimisation des Requêtes Fédérées :** Développer des stratégies pour paralléliser les appels MCP et optimiser le coût (en temps et en tokens) des requêtes distribuées.

---
