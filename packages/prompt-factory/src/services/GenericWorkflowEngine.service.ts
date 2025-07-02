import { IFileSystem } from '@jabbarroot/types';
import { 
  JabbarProject, 
  FileContentService, 
  SystemBrickManager 
} from '@jabbarroot/core';
import { ArtefactService } from './artefact.service';
import { PromptTemplateService } from './PromptTemplate.service';
import { GenericAgentExecutor } from '../executors/GenericAgent.executor';
import { AgentManifest, AgentDefinition } from '../types/agent.types';
import * as path from 'path';

export class GenericWorkflowEngine {
  constructor(
    private readonly fs: IFileSystem,
    private readonly systemBrickManager: SystemBrickManager,
    private readonly artefactService: ArtefactService,
    private readonly fileContentService: FileContentService,
    private readonly promptTemplateService: PromptTemplateService
  ) {}

  private async loadAgentManifest(projectRootPath: string): Promise<AgentManifest> {
    const manifestPath = path.join(projectRootPath, '.jabbarroot', '.jabbarroot_data', 'system', 'agents', 'manifest.json');
    const content = await this.fs.readFile(manifestPath);
    return JSON.parse(content) as AgentManifest;
  }

  private findAgentDefinition(manifest: AgentManifest, agentId: string): AgentDefinition {
    const agentDef = manifest.agents.find(a => a.id === agentId);
    if (!agentDef) {
      throw new Error(`Agent avec l'ID "${agentId}" non trouvé dans le manifeste.`);
    }
    return agentDef;
  }

  private async gatherInputContext(project: JabbarProject, agentDef: AgentDefinition): Promise<string> {
    let userContext = '';
    for (const source of agentDef.inputSources) {
      const brick = await this.systemBrickManager.findSystemBrick(project, source.name);
      if (!brick) {
        console.warn(`Source d'entrée "${source.name}" non trouvée pour l'agent "${agentDef.id}".`);
        continue;
      }

      userContext += `--- SOURCE: ${source.name} ---\n`;
      if (source.type === 'artefact') {
        const content = await this.artefactService.readArtefactContent(brick, 'report.json'); // Assumant un nom de fichier standard
        userContext += `${content}\n\n`;
      } else if (source.type === 'memory') {
        const content = await this.fileContentService.buildContentFromFiles(
          brick.files_scope,
          project.projectRootPath,
          'none'
        );
        userContext += `${content}\n\n`;
      }
    }
    return userContext;
  }

  private async handleOutput(project: JabbarProject, agentDef: AgentDefinition, result: string): Promise<void> {
    const output = agentDef.output;
    switch (output.type) {
      case 'file':
        const targetPath = path.join(project.projectRootPath, output.target);
        const targetDir = path.dirname(targetPath);
        await this.fs.createDirectory(targetDir); // Crée le dossier si nécessaire
        await this.fs.writeFile(targetPath, result);
        console.log(`[GenericWorkflowEngine] Sortie écrite dans le fichier : ${targetPath}`);
        break;
      // Autres cas (artefact, clipboard) à implémenter plus tard
      default:
        console.warn(`Type de sortie non supporté: ${output.type}`);
    }
  }

  public async executeAgent(agentId: string, project: JabbarProject, apiKey: string): Promise<void> {
    console.log(`[GenericWorkflowEngine] Exécution de l'agent: ${agentId}`);
    
    // 1. Charger le manifeste et trouver l'agent
    const manifest = await this.loadAgentManifest(project.projectRootPath);
    const agentDef = this.findAgentDefinition(manifest, agentId);

    // 2. Récupérer et assembler le contexte d'entrée
    const userContext = await this.gatherInputContext(project, agentDef);
    if (!userContext.trim()) {
        throw new Error(`Le contexte d'entrée pour l'agent "${agentId}" est vide. Assurez-vous que les briques sources existent et sont peuplées.`);
    }

    // 3. Charger le prompt système
    const [role, templateName] = agentDef.promptFile.split('/');
    const systemPrompt = await this.promptTemplateService.render(
      templateName.replace('.prompt.md', ''),
      project.projectRootPath,
      role,
      {}
    );

    // 4. Invoquer l'exécuteur IA
    const executor = new GenericAgentExecutor(apiKey);
    const result = await executor.execute(systemPrompt, userContext);

    // 5. Gérer la sortie
    await this.handleOutput(project, agentDef, result);
    console.log(`[GenericWorkflowEngine] Agent "${agentId}" exécuté avec succès.`);
  }
}