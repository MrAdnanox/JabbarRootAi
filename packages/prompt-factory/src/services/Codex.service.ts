// packages/prompt-factory/src/services/Codex.service.ts
import { IFileSystem } from '@jabbarroot/types';
import * as path from 'path';

export class CodexService {
  constructor(private readonly fs: IFileSystem) {}

  public async getAgentPrompt(agentName: string, projectRoot: string): Promise<string> {
    const promptPath = path.join(projectRoot, '.jabbarroot', 'prompt-factory', 'agents', `${agentName}.agent.md`);
    try {
      return await this.fs.readFile(promptPath);
    } catch (error) {
      throw new Error(`Prompt pour l'agent "${agentName}" introuvable à : ${promptPath}`);
    }
  }
}

// packages/prompt-factory/src/services/Artefact.service.ts
import { ProjectService, BrickService, BrickContext } from '@jabbarroot/core';

export class ArtefactService {
  private readonly ARTEFACT_PREFIX = '[ARTEFACT]';

  constructor(
    private readonly projectService: ProjectService,
    private readonly brickService: BrickService
  ) {}

  public async findArtefactBrick(projectId: string, featureName: string): Promise<BrickContext | undefined> {
    const bricks = await this.brickService.getBricksByProjectId(projectId);
    const targetName = `${this.ARTEFACT_PREFIX} ${featureName}`;
    return bricks.find(b => b.name === targetName);
  }

  public async writeArtefact(projectId: string, featureName: string, content: string): Promise<BrickContext> {
    const existingArtefact = await this.findArtefactBrick(projectId, featureName);
    if (existingArtefact) {
      // Pour l'instant, le contenu est stocké dans un fichier unique.
      // Une évolution future pourrait stocker le contenu directement dans la brique.
      // NOTE: Cette partie dépendra de l'évolution de BrickService pour gérer le contenu.
      // Pour l'instant, on met à jour le nom pour montrer le principe.
      return await this.brickService.updateBrick(existingArtefact.id, { name: existingArtefact.name });
    }

    const newBrick = await this.brickService.createBrick(
      projectId,
      `${this.ARTEFACT_PREFIX} ${featureName}`,
      { special_sections: { "content": content } }, // Stockage du contenu
      false // Les briques d'artefact ne sont pas actives pour la compilation par défaut
    );
    await this.projectService.addBrickIdToProject(projectId, newBrick.id);
    return newBrick;
  }
}