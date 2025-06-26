import { ProgrammableContext } from '../models/programmableContext';
import { StructureGenerationService, StructureGenerationOptions } from './structureGeneration.service';
import { FileContentService } from './fileContent.service';
import { CompactionService } from './compaction.service';
// IFileSystem, IStorage ne sont pas directement utilisés ici, on peut les enlever.

/**
 * Superviseur d'orchestration pour la construction d'un contexte programmable
 * à partir d'un plan.
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

    // 1. Générer l'arborescence et la stocker. Elle ne sera PAS compressée.
    if (context.options.include_project_tree) {
      const report = await this.structureGenerationService.generate(
        projectRootPath, // Correction : le startPath doit être la racine du projet
        structureGenOptions
      );
      if (report?.tree) {
        outputParts.push('--- PROJECT TREE ---\n' + report.tree);
      }
    }

    // 2. Générer le contenu des fichiers.
    const fileContents = await this.fileContentService.buildContentFromFiles(files_scope, projectRootPath);
    
    if (fileContents) {
      // 3. Compresser UNIQUEMENT le contenu des fichiers.
      const compressedContents = this.compactionService.compress(fileContents, context.options.compression_level);
      outputParts.push('--- FILE CONTENTS ---\n' + compressedContents);
    }

    // 4. Assembler les parties finales. L'arborescence est intacte.
    return outputParts.join('\n\n');
  }
}