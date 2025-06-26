# Syntaxe des menus contextuels VS Code

## Structure de base dans `package.json`

```json
"contributes": {
  "menus": {
    "view/title": [
      {
        "command": "monExtension.maCommande",
        "when": "view == monExtension.maView",
        "group": "navigation"
      }
    ],
    "view/item/context": [
      {
        "command": "monExtension.autreCommande",
        "when": "view == monExtension.maView && viewItem == monItem",
        "group": "1_actions"
      }
    ]
  }
}
```

## Groupes de menu

Les groupes principaux (par ordre d'affichage) :
- `navigation` - En haut du menu
- `1_creation` - Pour les actions de création
- `2_actions` - Actions principales
- `3_secondary` - Actions secondaires

## Conditions (when)

Exemples de conditions courantes :
- `view == monExtension.maView` - Pour une vue spécifique
- `viewItem == monItem` - Pour un type d'élément spécifique
- `viewItem == monAutreItem` - Pour un autre type d'élément

## Pour les fichiers dans l'arborescence

Pour les éléments de type fichier, utilisez :
- `viewItem == jabbarrootFile` pour les fichiers
- `viewItem == jabbarrootBrick` pour les briques
- `viewItem == jabbarrootProject` pour les projets

## Exemple complet pour jabbarroot

```json
"view/item/context": [
  {
    "command": "jabbarroot.createBrickInProject",
    "when": "view == jabbarroot.contextView && viewItem == jabbarrootProject",
    "group": "1_creation"
  },
  {
    "command": "jabbarroot.toggleBrickActiveState",
    "when": "view == jabbarroot.contextView && viewItem == jabbarrootBrick",
    "group": "2_actions"
  },
  {
    "command": "jabbarroot.addFileToBrick",
    "when": "view == jabbarroot.contextView && viewItem == jabbarrootBrick",
    "group": "2_actions"
  },
  {
    "command": "jabbarroot.removeFileFromBrick",
    "when": "view == jabbarroot.contextView && viewItem == jabbarrootBrick",
    "group": "2_actions"
  }
]
```

## Points importants

1. Les commandes doivent être déclarées dans `contributes.commands`
2. Les conditions `when` sont sensibles à la casse
3. L'ordre des groupes détermine l'ordre d'affichage
4. Utilisez des groupes personnalisés avec préfixe numérique pour contrôler l'ordre
