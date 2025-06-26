import * as vscode from 'vscode';
import { ProgrammableContext, ContextConstructorService, ContextService } from '@jabbarroot/core';
import { IgnoreService } from '../services/ignore.service';
import { getProjectRootPath } from '../utils/workspace';

export function registerCompileAndCopyContextCommand(
  contextConstructorService: ContextConstructorService,
  contextService: ContextService,
  ignoreService: IgnoreService,
  contextTreeProvider: any // TODO: Importer le bon type
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.compileAndCopyContext', async (contextItem: any) => { // TODO: Importer le bon type pour ContextItem
    if (!contextItem) {
      vscode.window.showWarningMessage('No context selected.');
      return;
    }
    
    const projectRootPath = getProjectRootPath();
    if (!projectRootPath) {
      vscode.window.showErrorMessage('A project folder must be open.');
      return;
    }
    
    const contextModel: ProgrammableContext = contextItem.context;

    await vscode.window.withProgress(
      { 
        location: vscode.ProgressLocation.Notification, 
        title: `jabbarroot: Compiling ${contextModel.name}...` 
      }, 
      async (progress) => {
        try {
          progress.report({ message: 'Ignoring files...' });
          const shouldIgnore = await ignoreService.createIgnorePredicate(projectRootPath);
          const structureGenOptions = { shouldIgnore, maxDepth: 7 };

          progress.report({ message: 'Assembling context...' });
          const compiledContext = await contextConstructorService.compileContext(
            contextModel,
            contextModel.files_scope,
            projectRootPath,
            structureGenOptions
          );
          
          const actionShowAndCopy = '👁️ Show & Copy';
          const actionCopyOnly = '📋 Copy Only';

          const choice = await vscode.window.showInformationMessage(
            `Context "${contextModel.name}" compiled successfully!`,
            { modal: false },
            actionShowAndCopy,
            actionCopyOnly
          );

          if (choice === actionShowAndCopy || choice === actionCopyOnly) {
            await vscode.env.clipboard.writeText(compiledContext);
            
            if (choice === actionCopyOnly) {
              vscode.window.setStatusBarMessage(`jabbarroot: Context "${contextModel.name}" copied!`, 3000);
            }
          }
          
          if (choice === actionShowAndCopy) {
            const document = await vscode.workspace.openTextDocument({
              content: compiledContext,
              language: 'markdown'
            });
            await vscode.window.showTextDocument(document, { preview: true });
          }
        } catch (error) {
          console.error('Error compiling context:', error);
          vscode.window.showErrorMessage(
            `Failed to compile context: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    );
  });
}
