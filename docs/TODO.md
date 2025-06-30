Feuille de Route Unifiée v2.1 : L'Ère du Triumvirat
Document : JABBARROOT_ROADMAP_V2.1.md
Statut : ACTIF
Dernière Révision : 28 Juin 2025
1. Vision Directrice v2.1 (Le "Pourquoi")
Cette feuille de route est l'implémentation stratégique de notre VISION.md. Notre mission est de construire et d'incarner le Triumvirat Cognitif. Chaque chantier et chaque tâche doit contribuer à renforcer mes capacités en tant qu'Orchestrateur, à spécialiser mes Agents Créatifs, ou à affûter la précision de mes Briques de Compétence.
Notre succès se mesure toujours par un gain de Temps, d'Argent et de Clarté pour l'Opérateur.
2. Les 3 Chantiers Stratégiques (Le "Quoi")
Nos efforts se concentrent sur trois chantiers parallèles et interdépendants qui constituent la fondation et l'évolution de l'écosystème.
Chantier I : La Fiabilité Absolue (Les Fondations)
Philosophie : Un partenaire cognitif doit être, avant tout, digne de confiance. La fiabilité de mes outils (Briques) et de mes actions (Agents) est non-négociable.
Objectifs Clés :
Harness de Test (Vitest) : Mettre en place et maintenir une suite de tests automatisés pour le package @jabbarroot/core.
Validation des Services : Assurer une couverture de test significative sur les services fondamentaux (ProjectService, BrickService, CompactionService).
Validation des Briques : Chaque Brique de Compétence doit avoir un test unitaire qui valide sa sortie par rapport à son schéma Zod pour un ensemble d'entrées connues.
Chantier II : La Cognition Architecturale (L'Intelligence)
Philosophie : Démontrer et développer mes capacités d'orchestration en construisant des workflows cognitifs complets, de la perception à la création.
Objectif Stratégique : Implémenter le workflow generateReadme comme preuve de concept de l'architecture du Triumvirat.
Objectif 2.1 : Forger la première Brique de Compétence.
Livrable : La Brique core.bricks.analytics.structure-decoder.brick.v1.md et son schéma de validation Zod structureDecoder.schema.ts.
Objectif 2.2 : Forger le premier Agent Créatif.
Livrable : L'Agent core.agents.doc.readme-scribe.agent.v1.md.
Objectif 2.3 : Bâtir le premier Workflow Orchestré.
Livrable : La commande generateReadme.command.ts qui m'utilise, moi, JabbarRoot, pour exécuter le pipeline complet : appeler la Brique, compiler le contexte, et commander l'Agent.
Chantier III : La Clarté Partagée (Le Codex)
Philosophie : La connaissance non documentée est une connaissance perdue. Notre projet doit être aussi clair pour un nouveau contributeur qu'il l'est pour nous aujourd'hui.
Objectifs Clés :
Maintenance du Codex : S'assurer que les documents fondateurs (VISION.md, ARCHITECTURE.md, TODO.md) sont toujours synchronisés.
Discipline JSDoc : Appliquer une politique stricte de documentation pour toutes les fonctions, classes et types exportés.
Documentation Utilisateur : Créer un GUIDE.md clair qui explique comment utiliser l'extension et, plus important, comment penser avec l'écosystème JabbarRoot.
3. Prochaine Action Immédiate (Le Point de Départ)
Conformément à cette feuille de route, nous allons initier le Chantier II : La Cognition Architecturale, car c'est le cœur de notre vision.
Action : Créer l'architecture de fichiers pour notre première Brique de Compétence.
Livrables Concrets :
Créer le fichier (vide ou avec le contenu déjà défini) : .jabbarroot/prompts/core/bricks/analytics/structure-decoder.brick.v1.md.
Créer le fichier : packages/core/src/models/codex/bricks/analytics/structureDecoder.schema.ts avec le schéma Zod que nous avons défini.
Raison : C'est l'action la plus fondamentale qui matérialise notre nouvelle architecture. C'est la première pierre de la cathédrale.