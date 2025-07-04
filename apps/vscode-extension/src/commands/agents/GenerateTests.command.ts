import * as vscode from 'vscode';
import { ICommandModule, IService, ServiceCollection } from '../../core/interfaces';
import { UnitTestGeneratorService } from '@jabbarroot/prompt-factory';
import { DialogService } from '../../services/ui/dialog.service';
import { GeminiConfigService } from '../../services/config/gemini.config.service';
import { NotificationService } from '../../services/ui/notification.service';

export class GenerateTestsCommand implements ICommandModule {
  public readonly metadata = {
    id: 'jabbarroot.test.GenerateTests',
    title: 'Générer des tests unitaires',
    category: 'jabbarroot' as const,
  };
  public readonly dependencies = [
    'unitTestGeneratorService',
    'dialogService',
    'geminiConfigService',
    'notificationService'
  ] as const;

  public async execute(services: Map<keyof ServiceCollection, IService>): Promise<void> {
    const testGenerator = services.get('unitTestGeneratorService') as UnitTestGeneratorService;
    const dialogService = services.get('dialogService') as DialogService;
    const geminiConfigService = services.get('geminiConfigService') as GeminiConfigService;
    const notificationService = services.get('notificationService') as NotificationService;

    try {
      const apiKeyResult = await geminiConfigService.getApiKey();
      if (apiKeyResult.isFailure()) {
        await dialogService.showConfigureApiKeyDialog();
        return;
      }
      const apiKey = apiKeyResult.value;

      const project = await dialogService.showProjectPicker();
      if (!project) return;

      await notificationService.withProgress(`Génération des tests pour "${project.name}"`, async () => {
          const testContent = await testGenerator.generateTests(project, apiKey);
          if (!testContent || testContent.trim().length === 0) {
            throw new Error('Aucun test généré. Le résultat est vide.');
          }
          const language = project.projectRootPath.endsWith('.js') ? 'javascript' : 'typescript';
          const document = await vscode.workspace.openTextDocument({
            content: testContent,
            language: language
          });
          await vscode.window.showTextDocument(document, {
            preview: false,
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: true
          });
      });

      notificationService.showInfo(`Tests unitaires pour "${project.name}" générés avec succès !`);
    } catch (error) {
      notificationService.showError('La génération des tests a échoué', error);
    }
  }
}

export default new GenerateTestsCommand();