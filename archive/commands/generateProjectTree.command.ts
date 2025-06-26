import * as vscode from 'vscode';
import { StructureGenerationService, StructureGenerationOptions } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';

export function registerGenerateProjectTreeCommand(
  structureGenerationService: StructureGenerationService,
  projectRootPath: string,
  ignoreService: IgnoreService
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.generateProjectTree', async () => {
    try {
      const shouldIgnore = await ignoreService.createIgnorePredicate(projectRootPath);
      const options: StructureGenerationOptions = {
        shouldIgnore,
        maxDepth: 10
      };
      
      const report = await structureGenerationService.generate(projectRootPath, options);
      
      if (report?.tree) {
        await vscode.env.clipboard.writeText(report.tree);
        vscode.window.showInformationMessage('Structure du projet copiée dans le presse-papiers');
      } else {
        throw new Error('Impossible de générer la structure du projet');
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la structure du projet:', error);
      vscode.window.showErrorMessage(
        `Erreur lors de la génération de la structure du projet: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });
}
