// Contenu final pour: apps/vscode-extension/src/providers/projectTreeItem.factory.ts
import * as vscode from 'vscode';
import { JabbarProject, BrickContext } from '@jabbarroot/types';

export type ProjectViewTreeItem = ProjectTreeItem | BrickTreeItem | InfoTreeItem | StatTreeItem | GroupTreeItem | FileTreeItem;

export class ProjectTreeItem extends vscode.TreeItem {
    public readonly contextValue = 'jabbarrootProject';

    constructor(
        public readonly project: JabbarProject,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
    ) {
        super(project.name, collapsibleState);
        this.tooltip = `Projet: ${project.name}\nChemin: ${project.projectRootPath}\nBriques: ${project.brickContextIds.length}`;
        this.iconPath = new vscode.ThemeIcon('symbol-folder');
    }
}

export class GroupTreeItem extends vscode.TreeItem {
    public readonly children: (BrickTreeItem | InfoTreeItem)[];

    constructor(
        public readonly label: string,
        children: (BrickTreeItem | InfoTreeItem)[] = []
    ) {
        super(label, vscode.TreeItemCollapsibleState.Expanded);
        this.children = children;
        this.tooltip = `Groupe: ${label}\n${children.length} élément(s)`;
        if (label === "Briques Utilisateur") {
            this.contextValue = 'jabbarrootUserBrickGroup';
        } else if (label === "JabbarRoot Système") {
            this.contextValue = 'jabbarrootSystemBrickGroup';
        } else {
            this.contextValue = 'jabbarrootGroup';
        }
        this.iconPath = new vscode.ThemeIcon('folder');
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
        let iconId = 'symbol-constant';
        let iconColorId;

        if (brick.isDefaultTarget) {
            iconId = 'target';
            labelSuffix += ' [CIBLE]';
        }

        if (brick.isActiveForProjectCompilation) {
            labelSuffix += ' (Active)';
            if (!brick.isDefaultTarget) {
                iconId = 'zap';
            }
        }

        this.description = `${brick.files_scope.length} fichier(s)${labelSuffix}`;
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

export class StatTreeItem extends vscode.TreeItem {
    constructor(label: string, description: string, icon: string) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.description = description;
        this.iconPath = new vscode.ThemeIcon(icon);
        this.contextValue = 'jabbarrootBrickStat';
    }
}

export class FileTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly brickId: string,
        public readonly parentProject: JabbarProject
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.contextValue = 'jabbarrootFileInBrick';
        this.description = `(dans ${this.parentProject.name})`;
        this.iconPath = new vscode.ThemeIcon('file-code');

        const fileUri = vscode.Uri.joinPath(
            vscode.Uri.file(this.parentProject.projectRootPath),
            this.label
        );

        this.command = {
            command: 'vscode.open',
            title: 'Ouvrir le fichier',
            arguments: [fileUri]
        };
    }
}