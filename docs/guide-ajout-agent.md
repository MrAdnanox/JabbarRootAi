# Guide d'ajout d'un nouvel agent à l'extension VS Code

Ce document explique comment ajouter un nouvel agent à l'extension VS Code JabbarRoot, en suivant l'architecture existante des agents comme `JabbarDoc` (génération de documentation) et `JabbarTest` (génération de tests unitaires).

## Architecture des agents

Un agent dans JabbarRoot est composé de trois éléments principaux :

1. **Un service** : Gère la logique métier et l'interaction avec l'IA
2. **Une commande** : Gère l'interaction utilisateur et l'orchestration
3. **Un prompt agent** : Fichier markdown contenant les instructions pour l'IA

## Étapes pour ajouter un nouvel agent

### 1. Créer le service de l'agent

Créez un nouveau fichier dans `apps/vscode-extension/src/services/` avec le format `[nomAgent].service.ts`.

**Exemple** : `codeGenerator.service.ts`

```typescript
import * as vscode from 'vscode';
import { 
  BrickService, 
  JabbarProject,
  FileContentService
} from '@jabbarroot/core';
import { GenericAgentExecutor } from '@jabbarroot/prompt-factory';
import { VscodeFileSystemAdapter } from '../adapters/vscodeFileSystem.adapter';

export class CodeGeneratorService {
  private fs: VscodeFileSystemAdapter;

  constructor(
    private readonly brickService: BrickService,
    private readonly fileContentService: FileContentService
  ) {
    this.fs = new VscodeFileSystemAdapter();
  }

  private async loadAgentPrompt(agentName: string, projectRoot: string): Promise<string> {
    const promptPath = path.join(projectRoot, '.jabbarroot', 'prompt-factory', 'agents', `${agentName}.agent.md`);
    try {
      return await this.fs.readFile(promptPath);
    } catch (error) {
      vscode.window.showErrorMessage(`Erreur: Prompt pour l'agent "${agentName}" non trouvé`);
      throw new Error(`Agent prompt for "${agentName}" not found.`);
    }
  }

  public async generateCode(project: JabbarProject, apiKey: string): Promise<string> {
    // Implémentation spécifique à l'agent
  }
}
```

### 2. Créer le fichier de prompt de l'agent

Créez un nouveau fichier dans `.jabbarroot/prompt-factory/agents/` avec le format `[nom-agent].agent.md`.

**Exemple** : `code-generator.agent.md`

```markdown
**JabbarCode v1.0**

## 1. Contexte et Finalité

**JabbarCode v1.0** est l'agent de génération de code pour l'écosystème **JabbarRoot**.

## 2. Principes Fondamentaux

1. **Qualité** : Générer du code de haute qualité
2. **Maintenabilité** : Code propre et bien documenté
3. **Cohérence** : Respect des conventions du projet

## 3. Instructions de Génération

[Instructions spécifiques à l'agent...]
```

### 3. Créer la commande

Créez un nouveau fichier dans `apps/vscode-extension/src/commands/[categorie]/[nomCommande].command.ts`.

**Exemple** : `generateCode.command.ts`

```typescript
import * as vscode from 'vscode';
import { ProjectService, JabbarProject } from '@jabbarroot/core';
import { CodeGeneratorService } from '../../services';

async function selectProject(projectService: ProjectService): Promise<JabbarProject | undefined> {
  // Implémentation existante
}

function getApiKey(): string | undefined {
  return vscode.workspace.getConfiguration('jabbarroot').get<string>('gemini.apiKey');
}

export function registerGenerateCodeCommand(
  projectService: ProjectService,
  codeGenerator: CodeGeneratorService
): vscode.Disposable {
  return vscode.commands.registerCommand('jabbarroot.code.generate', async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      vscode.window.showErrorMessage('Clé API non configurée');
      return;
    }

    const project = await selectProject(projectService);
    if (!project) return;

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `Génération de code pour "${project.name}"...`,
      cancellable: false
    }, async (progress) => {
      try {
        progress.report({ message: 'Génération en cours...' });
        const result = await codeGenerator.generateCode(project, apiKey);
        
        // Afficher le résultat
        const document = await vscode.workspace.openTextDocument({
          content: result,
          language: 'typescript'
        });
        await vscode.window.showTextDocument(document, { preview: false });
        
        vscode.window.showInformationMessage('Génération de code terminée !');
      } catch (error) {
        vscode.window.showErrorMessage(`Erreur: ${error}`);
      }
    });
  });
}
```

### 4. Enregistrer la commande dans `package.json`

Ajoutez la commande dans la section `contributes.commands` de `apps/vscode-extension/package.json` :

```json
{
  "command": "jabbarroot.code.generate",
  "title": "JabbarCode: Générer du code",
  "category": "jabbarroot",
  "icon": "$(code)"
}
```

### 5. Enregistrer la commande dans `extension.ts`

1. Ajoutez l'import du service et de la commande :

```typescript
import { CodeGeneratorService } from './services/codeGenerator.service';
import { registerGenerateCodeCommand } from './commands/code/generateCode.command';
```

2. Initialisez le service :

```typescript
const codeGeneratorService = new CodeGeneratorService(brickService, fileContentService);
```

3. Enregistrez la commande :

```typescript
const generateCodeCommand = registerGenerateCodeCommand(projectService, codeGeneratorService);
```

4. Ajoutez la commande aux abonnements :

```typescript
const subscriptions = [
  // Autres commandes...
  generateCodeCommand,
  // ...
];
```

## Bonnes pratiques

1. **Séparation des préoccupations** : Gardez la logique métier dans le service et l'UI dans la commande
2. **Gestion des erreurs** : Gérez correctement les erreurs et fournissez des messages clairs
3. **Journalisation** : Utilisez `console.log` pour le débogage
4. **Tests** : Ajoutez des tests unitaires pour le service
5. **Documentation** : Documentez le code et mettez à jour ce guide si nécessaire

## Exemples existants

- **Documentation** : `documentation.service.ts` + `generateReadme.command.ts` + `jabbar-doc.agent.md`
- **Tests unitaires** : `unitTestGenerator.service.ts` + `generateTests.command.ts` + `unit-test-generator.agent.md`

## Dépannage

- **Erreur d'import** : Vérifiez les chemins d'import et l'export dans `services/index.ts`
- **Commande non trouvée** : Vérifiez l'ID dans `package.json` et `registerCommand`
- **Erreur d'API** : Vérifiez la clé API et les logs de la console

## Prochaines étapes

1. Tester l'agent dans différents scénarios
2. Ajouter des tests unitaires
3. Documenter les cas d'utilisation spécifiques
4. Améliorer la gestion des erreurs et l'expérience utilisateur
