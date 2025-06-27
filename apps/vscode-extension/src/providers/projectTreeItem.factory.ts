// apps/vscode-extension/src/providers/projectTreeItem.factory.ts
import * as vscode from 'vscode';
import { JabbarProject, BrickContext, BrickContextOptions, JabbarProjectOptions } from '@jabbarroot/core'; // Importer les types du core

// Exportation groupée pour plus de propreté à l'import
export type ProjectViewTreeItem = ProjectTreeItem | BrickTreeItem | InfoTreeItem | StatTreeItem;

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

export class BrickTreeItem extends vscode.TreeItem {
    public readonly contextValue = 'jabbarrootBrick';

    constructor(
        public readonly brick: BrickContext,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(brick.name, collapsibleState);

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
