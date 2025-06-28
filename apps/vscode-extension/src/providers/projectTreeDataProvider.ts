// apps/vscode-extension/src/providers/projectTreeDataProvider.ts
import * as vscode from 'vscode';
import { ProjectService, BrickService, JabbarProject, BrickContext } from '@jabbarroot/core';
import { ProjectTreeItem, BrickTreeItem, InfoTreeItem, ProjectViewTreeItem, StatTreeItem, FileTreeItem } from './projectTreeItem.factory';
import { getProjectRootPath } from '../utils/workspace'; // Pour vérifier si un dossier est ouvert

export class ProjectTreeDataProvider implements vscode.TreeDataProvider<ProjectViewTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ProjectViewTreeItem | undefined | null | void> = new vscode.EventEmitter();
    readonly onDidChangeTreeData: vscode.Event<ProjectViewTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(
        private readonly projectService: ProjectService,
        private readonly brickService: BrickService,
        // private readonly statisticsService: StatisticsService, // Si on ajoute les stats
        // private readonly ignoreService: IgnoreService,       // Si on affiche des infos d'ignore
        private readonly extensionState: vscode.Memento // Pour gérer un "projet actif" si besoin plus tard
    ) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ProjectViewTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ProjectViewTreeItem): Promise<ProjectViewTreeItem[]> {
        if (!getProjectRootPath()) { // Vérifie si un dossier est ouvert globalement pour l'extension
            return [new InfoTreeItem('Ouvrez un dossier pour utiliser jabbarroot.', 'info')];
        }

        if (element) {
            if (element instanceof ProjectTreeItem) {
                // Charger les briques pour ce projet
                // Version optimisée: utilise les IDs stockés dans le projet
                const project = element.project;
                const brickItems: BrickTreeItem[] = [];
                for (const brickId of project.brickContextIds) {
                    const brick = await this.brickService.getBrick(brickId);
                    if (brick) {
                        // On utilise CollapsibleState.Collapsed pour permettre l'affichage des fichiers
                        brickItems.push(new BrickTreeItem(brick, project, vscode.TreeItemCollapsibleState.Collapsed));
                    }
                }
                if (brickItems.length === 0) {
                    return [new InfoTreeItem('Aucune brique. Cliquez pour ajouter.', 'add')]; // TODO: Commande pour ajouter une brique
                }
                return brickItems.sort((a,b) => a.brick.name.localeCompare(b.brick.name)); // Tri par nom

            } else if (element instanceof BrickTreeItem) {
                // Afficher les fichiers de la brique
                const brick = element.brick;
                const parentProject = element.parentProject;

                if (brick.files_scope && brick.files_scope.length > 0) {
                    return brick.files_scope
                        .sort((a, b) => a.localeCompare(b)) // Trier les fichiers par ordre alphabétique
                        .map(filePath => new FileTreeItem(filePath, brick.id, parentProject));
                } else {
                    return [new InfoTreeItem('Aucun fichier dans cette brique.', 'info')];
                }
            }
            return []; // Ne devrait pas arriver pour InfoTreeItem ou StatTreeItem
        } else {
            // Racine: charger tous les projets
            const projects = await this.projectService.getAllProjects();
            if (projects.length === 0) {
                return [new InfoTreeItem('Aucun projet jabbarroot. Cliquez pour créer.', 'add')]; // TODO: Commande pour créer un projet
            }
            return projects
                .map((p: JabbarProject) => new ProjectTreeItem( p ) )
                .sort((a, b) => a.project.name.localeCompare(b.project.name)); // Tri par nom
        }
    }
}
