// apps/vscode-extension/src/providers/projectTreeItem.factory.ts
import * as vscode from 'vscode';
import { JabbarProject, BrickContext, BrickContextOptions, JabbarProjectOptions } from '@jabbarroot/core'; // Importer les types du core

// Exportation groupée pour plus de propreté à l'import
export type ProjectViewTreeItem = ProjectTreeItem | BrickTreeItem | InfoTreeItem | StatTreeItem | GroupTreeItem;

export class ProjectTreeItem extends vscode.TreeItem {
    public readonly contextValue = 'jabbarrootProject'; // Pour les menus contextuels

    constructor(
        public readonly project: JabbarProject,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
    ) {
        super(project.name, collapsibleState);
        this.tooltip = `Projet: ${project.name}\nChemin: ${project.projectRootPath}\nBriques: ${project.brickContextIds.length}`;
        // TODO: Choisir une icône pour les projets (ex: 'project', 'server-environment')
        this.iconPath = new vscode.ThemeIcon('symbol-folder'); // Placeholder
    }
}

/**
 * Représente un groupe d'éléments dans l'arborescence (ex: "Briques Utilisateur", "JabbarRoot Système")
 */
export class GroupTreeItem extends vscode.TreeItem {
    public readonly children: (BrickTreeItem | InfoTreeItem)[];

    constructor(
        public readonly label: string,
        children: (BrickTreeItem | InfoTreeItem)[] = []
    ) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.children = children;
        this.tooltip = `Groupe: ${label}\n${children.length} élément(s)`;
        
        // Définition du contextValue en fonction du label du groupe
        if (label === "Briques Utilisateur") {
            this.contextValue = 'jabbarrootUserBrickGroup';
        } else if (label === "JabbarRoot Système") {
            this.contextValue = 'jabbarrootSystemBrickGroup';
        } else {
            this.contextValue = 'jabbarrootGroup';
        }
        
        // Utilisation d'une icône de dossier ou de collection selon le contexte
        this.iconPath = new vscode.ThemeIcon('folder');
        
        // Pour les groupes vides, on ne les rend pas dépliables
        if (children.length === 0) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
        }
    }
}

export class BrickTreeItem extends vscode.TreeItem {
    public readonly contextValue = 'jabbarrootBrick';
    public readonly brick: BrickContext;
    public readonly parentProject: JabbarProject;

    constructor(
        brick: BrickContext,
        parentProject: JabbarProject,
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
    ) {
        super(brick.name, collapsibleState);
        
        this.brick = brick;
        this.parentProject = parentProject;

        let labelSuffix = '';
        let iconId = 'symbol-constant'; // Icône par défaut pour brique inactive
        let iconColorId; // Pas de couleur spécifique par défaut

        if (brick.isDefaultTarget) {
            iconId = 'target';
            labelSuffix += ' [CIBLE]';
        }

        if (brick.isActiveForProjectCompilation) {
            labelSuffix += ' (Active)'; // Texte pour la description ou à intégrer dans le label
            if (!brick.isDefaultTarget) { // Ne pas écraser l'icône de cible
                iconId = 'zap'; // Icône suggérant l'activité (ancienne icône pour contexte actif)
            }
            // iconColorId = new vscode.ThemeColor('debugIcon.startForeground'); // Exemple de couleur
        }

        // this.label = `${brick.name}${labelSuffix}`; // Optionnel: ajouter au label principal
        this.description = `${brick.files_scope.length} fichier(s)${labelSuffix}`; // Ajout du suffixe à la description
        this.tooltip = `Brique: ${brick.name}\n${this.description}\nID: ${brick.id}`;
        
        if (iconColorId) {
            this.iconPath = new vscode.ThemeIcon(iconId, iconColorId);
        } else {
            this.iconPath = new vscode.ThemeIcon(iconId);
        }
    }
}

export class InfoTreeItem extends vscode.TreeItem {
    constructor(label: string, iconId?: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        if (iconId) {
            this.iconPath = new vscode.ThemeIcon(iconId);
        }
        this.contextValue = 'jabbarrootInfo';
    }
}

// Si on veut réintégrer les stats sous les briques
export class StatTreeItem extends vscode.TreeItem {
    constructor(label: string, description: string, icon: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.iconPath = new vscode.ThemeIcon(icon);
        this.contextValue = 'jabbarrootBrickStat';
    }
}

/**
 * Représente un fichier à l'intérieur d'une brique dans la vue arborescente
 */
export class FileTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string, // Le chemin relatif du fichier
        public readonly brickId: string, // L'ID de la brique parente
        public readonly parentProject: JabbarProject // Le projet parent pour le contexte
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'jabbarrootFileInBrick';
        this.description = `(dans ${this.parentProject.name})`; // Description pour clarifier
        this.iconPath = new vscode.ThemeIcon('file-code'); // Icône de fichier standard
        
        // Construction de l'URI absolue du fichier
        const fileUri = vscode.Uri.joinPath(
            vscode.Uri.file(this.parentProject.projectRootPath), 
            this.label
        );
        
        // Définition de la commande pour l'ouverture du fichier
        this.command = {
            command: 'vscode.open', // Commande native de VS Code pour ouvrir un fichier
            title: 'Ouvrir le fichier', // Texte du tooltip
            arguments: [fileUri] // L'URI du fichier à ouvrir
        };
    }
}
