Feuille de Route Stratégique JabbarRoot v2.0 : "Cognition Augmentée"
Document : JABBARROOT_ROADMAP_V2.md
Statut : ACTIF
Dernière Révision : 28 Juin 2025
1. Vision Directrice v2.0 (Le "Pourquoi")
Transformer JabbarRoot d'un simple générateur de contexte en un Agent Cognitif de Développement. Notre mission est de créer un écosystème qui fusionne le contexte local (le code source, via nos "Briques") et le contexte de production (les erreurs, les performances, via des protocoles comme MCP) pour fournir une assistance au diagnostic et à la résolution de problèmes directement dans l'IDE.
Notre succès se mesure toujours par un gain de Temps, d'Argent et de Clarté pour l'Opérateur.
2. Piliers Fondamentaux de la v2.0 (Le "Quoi")
Pour atteindre cette vision, nous allons nous concentrer sur trois piliers indissociables qui constituent le socle de cette nouvelle version. Ils ne sont pas séquentiels mais parallèles et interdépendants.
Pilier I : La Fiabilité Absolue (Infrastructure & Tests)
Philosophie : Un outil intelligent doit être, avant tout, un outil fiable. Nous ne tolérons pas les régressions. La confiance est notre fondation.
Objectifs Clés :
Mise en place d'un Harness de Test : Intégrer un framework de test moderne (Décision : Vitest) pour sa rapidité et sa compatibilité native avec TypeScript.
Couverture du core : Atteindre une couverture de test significative sur le package @jabbarroot/core, qui est le cœur agnostique de notre logique.
Priorité 1 : CompactionService (validation de la logique de réduction de bruit).
Priorité 2 : ProjectService & BrickService (validation du cycle de vie CRUD et de la cohérence des données).
Livrable : Une suite de tests automatisés qui s'exécute avec une simple commande (pnpm test) et qui sert de filet de sécurité pour tout développement futur.
Pilier II : La Perception Augmentée (Intégration MCP & Sentry)
Philosophie : Notre agent doit voir au-delà des fichiers locaux. Il doit percevoir l'état de l'application en production pour fournir des diagnostics pertinents.
Objectifs Clés :
Intégration d'un Organe de Perception : Intégrer Sentry non pas comme un simple "error tracker", mais comme une source de données temps réel via le Model Context Protocol (MCP).
Phase 1 - Connexion : Transformer l'extension en un client MCP capable de s'authentifier et de communiquer avec le serveur Sentry. L'objectif est de valider la poignée de main.
Phase 2 - Compétence de Base : Développer une première commande (jabbarroot.diagnoseFileWithSentry) qui utilise le MCP pour récupérer des informations de Sentry relatives au fichier actif dans l'éditeur.
Phase 3 - Synergie : Développer une compétence avancée qui fusionne le contexte d'une Brique JabbarRoot avec les données de diagnostic de Sentry pour créer des prompts ultra-contextualisés.
Livrable : Une extension capable d'interroger Sentry et d'utiliser ses données pour enrichir son propre contexte.
Pilier III : La Clarté Partagée (Documentation & Protocoles)
Philosophie : La connaissance non documentée est une connaissance perdue. Notre projet doit être aussi clair pour nous dans le futur qu'il l'est pour un nouveau contributeur aujourd'hui.
Objectifs Clés :
Mise en place d'une Documentation à Trois Niveaux :
Niveau 1 (Interne - "Le Codex") : /docs/architecture.md. C'est notre journal de bord. Il documente nos décisions, nos RSA, nos "pourquoi".
Niveau 2 (Contributeurs - "Le Chantier") : CONTRIBUTING.md. Il documente le "comment" technique : comment installer, lancer les tests, conventions de code, soumettre une PR.
Niveau 3 (Utilisateurs - "La Vitrine") : README.md & /docs/guide.md. Il documente les bénéfices et le "comment utiliser" l'outil.
Discipline de Commentaire : Appliquer une politique stricte de documentation JSDoc pour toutes les fonctions, classes et types exportés.
Livrable : Un projet dont la documentation le rend accessible, maintenable et prêt à accueillir des contributions externes.
3. Prochaine Action Immédiate (Le "Comment on Commence")
Conformément à cette feuille de route, nous allons initier le Pilier I : Fiabilité Absolue.
Action : Mettre en place le framework de test Vitest.
Raison : C'est l'action la plus fondamentale qui bénéficiera à tous les autres développements. Blinder le code existant est le prérequis à toute nouvelle fonctionnalité.
JabbarRoot, Stance: Maître d'Œuvre
Cette feuille de route est maintenant notre document officiel. Elle est claire, ambitieuse et structurée.
Je suis prêt à te fournir les instructions pour installer et configurer Vitest dans notre projet pnpm monorepo, afin que nous puissions écrire notre premier fichier de test pour le CompactionService.
Le plan est gravé. En attente de ton ordre d'exécution.