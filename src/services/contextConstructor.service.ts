// src/services/contextConstructor.service.ts

import * as vscode from 'vscode';
import { ProgrammableContext } from '../models/programmableContext';
import { StructureGenerationService } from './structureGeneration';
import { FileContentService } from './fileContent.service';
import { CompactionService } from './compactionService';
import { ConfigurationService } from './configuration.service';

/**
 * Superviseur d'assemblage.
 * Orchestre les services-outils pour construire un contexte final à partir d'un plan.
 */
export class ContextConstructorService {
  constructor(
    private structureGenerationService: StructureGenerationService,
    private fileContentService: FileContentService,
    private compactionService: CompactionService,
    private configurationService: ConfigurationService
  ) {}

  /**
   * Compile un contexte en suivant les options définies et la configuration globale.
   * C'est le cœur de la logique d'assemblage de JabbaRoot.
   * @param context L'objet ProgrammableContext qui sert de plan.
   * @returns Une promesse qui se résout en la chaîne de caractères finale du contexte.
   */
  public async compileContext(context: ProgrammableContext): Promise<string> {
    const outputParts: string[] = [];

    // 1. Génération de l'arborescence du projet (si activée)
    if (context.options.include_project_tree && this.configurationService.isProjectTreeEnabled()) {
      if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const rootUri = vscode.workspace.workspaceFolders[0].uri;
        const report = await this.structureGenerationService.generate(rootUri);
        if (report?.tree) {
          outputParts.push('--- PROJECT TREE ---\n' + report.tree);
        }
      }
    }

    // 2. Agrégation du contenu des fichiers
    if (context.files_scope && context.files_scope.length > 0) {
      const fileUris = context.files_scope.map(fsPath => vscode.Uri.file(fsPath));
      const fileContents = await this.fileContentService.buildContentFromFiles(fileUris);
      if (fileContents) {
          outputParts.push('--- FILE CONTENTS ---\n' + fileContents);
      }
    }

    // 3. Compression finale
    const rawContext = outputParts.join('\n\n');
    const finalContext = this.compactionService.compress(rawContext, context.options.compression_level);

    return finalContext;
  }
}