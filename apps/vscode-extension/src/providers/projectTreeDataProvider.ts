import * as vscode from 'vscode';
import { ProjectService, BrickService, JabbarProject, BrickContext } from '@jabbarroot/core';
import { ProjectTreeItem, BrickTreeItem, InfoTreeItem, ProjectViewTreeItem, FileTreeItem, GroupTreeItem } from './projectTreeItem.factory'; // Assurez-vous d'importer GroupTreeItem
import { getProjectRootPath } from '../utils/workspace';

export class ProjectTreeDataProvider implements vscode.TreeDataProvider<ProjectViewTreeItem | GroupTreeItem> { // Mettre à jour le type générique
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectViewTreeItem | GroupTreeItem | undefined | null | void> = new vscode.EventEmitter();
  readonly onDidChangeTreeData: vscode.Event<ProjectViewTreeItem | GroupTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor(
    private readonly projectService: ProjectService,
    private readonly brickService: BrickService,
    private readonly extensionState: vscode.Memento
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: ProjectViewTreeItem | GroupTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ProjectViewTreeItem | GroupTreeItem): Promise<(ProjectViewTreeItem | GroupTreeItem)[]> {
    if (!getProjectRootPath()) {
      return [new InfoTreeItem('Ouvrez un dossier pour utiliser jabbarroot.', 'info')];
    }

    if (element) {
      // *** C'EST LE BLOC MANQUANT ET CRUCIAL ***
      if (element instanceof GroupTreeItem) {
        return element.children; // On retourne simplement les enfants déjà préparés
      }

      if (element instanceof ProjectTreeItem) {
        const project = element.project;
        const allBricks: BrickContext[] = [];
        for (const brickId of project.brickContextIds) {
            const brick = await this.brickService.getBrick(brickId);
            if (brick) allBricks.push(brick);
        }

        if (allBricks.length === 0) {
            // Pas besoin de groupes s'il n'y a pas de briques
            return [];
        }
        
        const systemBricks = allBricks
            .filter(b => b.name.startsWith('['))
            .map(b => new BrickTreeItem(b, project, vscode.TreeItemCollapsibleState.Collapsed))
            .sort((a, b) => a.brick.name.localeCompare(b.brick.name));

        const userBricks = allBricks
            .filter(b => !b.name.startsWith('['))
            .map(b => new BrickTreeItem(b, project, vscode.TreeItemCollapsibleState.Collapsed))
            .sort((a, b) => a.brick.name.localeCompare(b.brick.name));

        const groups: GroupTreeItem[] = [];

        if (userBricks.length > 0) {
            groups.push(new GroupTreeItem("Briques Utilisateur", userBricks));
        } else {
            // Optionnel : Ajouter un item d'information si le groupe est vide
            groups.push(new GroupTreeItem("Briques Utilisateur", [new InfoTreeItem('Aucune brique utilisateur.')]));
        }

        if (systemBricks.length > 0) {
            groups.push(new GroupTreeItem("JabbarRoot Système", systemBricks));
        }
        
        return groups;
      } else if (element instanceof BrickTreeItem) {
        // Cette logique reste valide
        const brick = element.brick;
        const parentProject = element.parentProject;
        if (brick.files_scope && brick.files_scope.length > 0) {
          return brick.files_scope
            .sort((a, b) => a.localeCompare(b))
            .map(filePath => new FileTreeItem(filePath, brick.id, parentProject));
        } else {
          return [new InfoTreeItem('Aucun fichier dans cette brique.', 'info')];
        }
      }
      return [];
    } else {
      // La logique racine reste valide
      const projects = await this.projectService.getAllProjects();
      if (projects.length === 0) {
        return [new InfoTreeItem('Aucun projet jabbarroot. Cliquez pour créer.', 'add')];
      }
      return projects
        .map((p: JabbarProject) => new ProjectTreeItem(p))
        .sort((a, b) => a.project.name.localeCompare(b.project.name));
    }
  }
}