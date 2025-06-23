// packages/core/src/services/contextConstructor.service.ts

import { ProgrammableContext } from '../models/programmableContext';
import { StructureGenerationService, StructureGenerationOptions } from './structureGeneration.service';
import { FileContentService } from './fileContent.service';
import { CompactionService } from './compaction.service';
import { IFileSystem, IStorage } from '@jabbarroot/types';

/**
 * Superviseur d'assemblage.
 * Orchestre les services-outils pour construire un contexte final à partir d'un plan.
 */
export class ContextConstructorService {
  constructor(
    private readonly structureGenerationService: StructureGenerationService,
    private readonly fileContentService: FileContentService,
    private readonly compactionService: CompactionService
  ) {}

  public async compileContext(
    context: ProgrammableContext,
    files_scope: string[],
    projectRootPath: string,
    structureGenOptions: StructureGenerationOptions
  ): Promise<string> {
    const outputParts: string[] = [];

    if (context.options.include_project_tree) {
      // L'erreur était ici : le service attend 2 arguments.
      const report = await this.structureGenerationService.generate(projectRootPath, structureGenOptions);
      if (report?.tree) {
        outputParts.push('--- PROJECT TREE ---\n' + report.tree);
      }
    }

    if (files_scope.length > 0) {
      // L'erreur était ici : le service attend 2 arguments.
      const fileContents = await this.fileContentService.buildContentFromFiles(files_scope, projectRootPath);
      if (fileContents) {
        outputParts.push('--- FILE CONTENTS ---\n' + fileContents);
      }
    }

    const rawContext = outputParts.join('\n\n');
    const finalContext = this.compactionService.compress(rawContext, context.options.compression_level);
    
    return finalContext;
  }
}