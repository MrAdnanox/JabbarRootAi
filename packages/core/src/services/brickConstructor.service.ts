// packages/core/src/services/brickConstructor.service.ts
import {
    BrickContext,
    JabbarProject,
    BrickContextOptions,
    JabbarProjectOptions,
    CompressionLevel
} from '../models/project.types';
// Définition de l'interface CompactionService localement pour éviter les problèmes d'import
export interface CompactionService {
    compact(text: string, level: CompressionLevel, filePath: string): Promise<string>;
}
import {
    StructureGenerationService,
    StructureGenerationOptions,
    GenerationReport
} from './structureGeneration.service';
import { FileContentService } from './fileContent.service';

export class BrickConstructorService {
    constructor(
        private readonly structureGenerationService: StructureGenerationService,
        private readonly fileContentService: FileContentService,
        private readonly compactionService: CompactionService
    ) {}

    // Méthode pour résoudre les options de type CompressionLevel
    public resolveCompressionOption(
        brickOptions: BrickContextOptions,
        projectOptions: JabbarProjectOptions
    ): CompressionLevel {
        if (brickOptions.compilationCompressionLevel !== undefined) {
            return brickOptions.compilationCompressionLevel;
        }
        // projectOptions.defaultBrickCompressionLevel est maintenant garanti d'être défini
        // (et non undefined) grâce à l'initialisation dans ProjectService.
        return projectOptions.defaultBrickCompressionLevel; 
    }

    // Méthode pour résoudre les options de type boolean (comme includeProjectTree)
    private resolveBooleanOption(
        brickOptions: BrickContextOptions,
        projectOptions: JabbarProjectOptions,
        brickOptionKey: keyof Pick<BrickContextOptions, 'compilationIncludeProjectTree'>, // Clé spécifique booléenne de BrickOptions
        projectDefaultKey: keyof Pick<JabbarProjectOptions, 'defaultBrickIncludeProjectTree'> // Clé spécifique booléenne de ProjectOptions
    ): boolean {
        const brickValue = brickOptions[brickOptionKey];
        if (brickValue !== undefined) {
            return brickValue;
        }
        // projectOptions[projectDefaultKey] est garanti d'être défini.
        return projectOptions[projectDefaultKey];
    }
    
    // Méthode pour résoudre les options de type number (comme maxDepth)
    private resolveOptionalNumberOption(
        brickOptions: BrickContextOptions, // BrickOptions ne stocke pas maxDepth directement pour la brique
        projectOptions: JabbarProjectOptions,
        projectDefaultKey: keyof Pick<JabbarProjectOptions, 'defaultBrickIncludeProjectTreeMaxDepth'>
    ): number | undefined { // Peut être undefined si pas défini dans le projet
        // Pour l'instant, maxDepth est uniquement une option de projet par défaut.
        // Si les briques pouvaient surcharger maxDepth, la logique serait :
        // if (brickOptions.compilationIncludeProjectTreeMaxDepth !== undefined) {
        //    return brickOptions.compilationIncludeProjectTreeMaxDepth;
        // }
        return projectOptions[projectDefaultKey];
    }


    public async assembleContextFromPreprocessedFiles(
        brick: BrickContext,
        project: JabbarProject,
        structureGenOptions: StructureGenerationOptions,
        preprocessedFiles: { filePath: string; content: string }[]
    ): Promise<string> {
        const outputParts: string[] = [];
        const finalIncludeProjectTree = this.resolveBooleanOption(
            brick.options,
            project.options,
            'compilationIncludeProjectTree',
            'defaultBrickIncludeProjectTree'
        );

        if (finalIncludeProjectTree) {
            const treeReport = await this.structureGenerationService.generate(
                project.projectRootPath,
                structureGenOptions
            );
            if (treeReport?.tree) {
                outputParts.push(`--- PROJECT TREE ---\n${treeReport.tree}`);
            }
        }

        if (preprocessedFiles.length > 0) {
            outputParts.push(`--- FILE CONTENTS ---`);
            const fileContents = preprocessedFiles
                .map(file => `---FILE:${file.filePath}---\n${file.content}`)
                .join('\n\n');
            outputParts.push(fileContents);
        }
        
        return outputParts.join('\n\n').trim();
    }
}