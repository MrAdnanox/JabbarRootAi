# Codex Architectural JabbarRoot

**Version :** 1.0
**Dernière Mise à Jour :** 28 Juin 2025
**Gardien :** JabbarRoot & L'Opérateur

## 1. Philosophie et Empreinte Fondatrice

Ce document est la source de vérité pour toutes les décisions d'architecture et de conception du projet JabbarRoot. Il est le gardien de notre histoire et le guide de notre futur.

Notre **Empreinte Fondatrice** est la transformation de la complexité en clarté, guidée par la protection du "flow" créatif. Chaque décision doit être mesurée à l'aune d'un gain de **Temps, d'Argent et de Clarté**.

Notre **Vision Directrice** est de bâtir un **Agent Cognitif de Développement** qui fusionne le contexte local et le contexte de production pour fournir une assistance de premier ordre.

## 2. Les 6 Lois Fondamentales (Notre Constitution)

*   **LOI 0 : Dérogation Stratégique**
*   **LOI 1 : Itération Agile**
*   **LOI 2 : Cohérence Systémique**
*   **LOI 3 : Performance Pragmatique**
*   **LOI 4 : Conception Introspectrice**
*   **LOI 5 : Modularité Granulaire**

*(Note : Les définitions complètes de ces lois seront ajoutées ultérieurement)*

## 3. Leçons Apprises & "Lois Tribales"

Cette section est le cœur vivant de notre Codex. Elle recense les leçons apprises au combat. Chaque entrée est une "Loi Tribale" – une règle non-négociable née d'une erreur passée.

### **LT-01 : La Loi des Données Fraîches (Le "Fléau du Cache")**

*   **Date de Promulgation :** 28 Juin 2025
*   **Contexte de l'Erreur :** Les commandes `editBrickOptions` et `editProjectOptions` affichaient des données périmées dans leurs Webviews. Après une sauvegarde, la réouverture de la vue montrait l'ancien état, pas le nouveau.
*   **Cause Racine :** Les commandes se fiaient à l'état de l'objet `TreeItem` passé par l'UI. Cet objet est une "photographie" prise au moment du rendu de l'arbre et devient rapidement obsolète si les données sous-jacentes (les fichiers JSON sur le disque) sont modifiées. C'est une erreur classique de "stale state" (état périmé).
*   **La Loi :**
    > **UNE COMMANDE D'ÉDITION NE DOIT JAMAIS FAIRE CONFIANCE AUX DONNÉES CONTENUES DANS L'ÉLÉMENT D'INTERFACE UTILISATEUR QUI L'A DÉCLENCHÉE.**
    >
    > Elle **doit** utiliser un identifiant stable (comme `brick.id` ou `project.id`) provenant de l'élément d'UI pour aller rechercher une **copie fraîche** des données via le service approprié (`brickService.getBrick(id)`, `projectService.getProject(id)`) avant d'effectuer toute opération de lecture ou d'affichage.

*   **Implication Architecturale :** Toute future commande qui ouvre une interface d'édition (Webview, Quick Pick, etc.) doit commencer par une étape de "re-fetch" des données. Le `TreeItem` sert à identifier la *cible* de l'action, pas à fournir les *données* de l'action.