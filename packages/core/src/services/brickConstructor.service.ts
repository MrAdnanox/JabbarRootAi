// packages/core/src/services/brickConstructor.service.ts
import {
    BrickContext,
    JabbarProject,
    BrickContextOptions,
    JabbarProjectOptions,
    CompressionLevel
} from '../models/project.types';
// Définition de l'interface ICompactionService localement pour éviter les problèmes d'import
export interface ICompactionService {
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
        private readonly compactionService: ICompactionService
    ) {}

    // Méthode pour résoudre les options de type CompressionLevel
    private resolveCompressionOption(
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


    public async compileBrick(
        brick: BrickContext,
        project: JabbarProject,
        structureGenOptionsForBrick: StructureGenerationOptions // Doit être complète ici
    ): Promise<string> {
        const outputParts: string[] = [];
        
        // 1. Résoudre les options de compilation finales pour cette brique
        const finalIncludeProjectTree = this.resolveBooleanOption(
            brick.options,
            project.options,
            'compilationIncludeProjectTree',
            'defaultBrickIncludeProjectTree'
        );

        const finalCompressionLevel = this.resolveCompressionOption(
            brick.options,
            project.options
        );

        // MaxDepth pour la génération d'arbre de la brique (si activée)
        // Prend la valeur de defaultBrickIncludeProjectTreeMaxDepth du projet.
        // StructureGenerationOptions passée en argument contient déjà le maxDepth
        // car elle est construite par l'appelant (ex: compileBrick.command.ts)
        // qui utilise ignoreService ET les options du projet/brique.
        // Donc, structureGenOptionsForBrick.maxDepth devrait être utilisé directement.

        // console.log(`[BrickConstructorService] Compiling Brick '${brick.name}'`);
        // console.log(`  - Final Include Tree: ${finalIncludeProjectTree}`);
        // console.log(`  - Final Compression: ${finalCompressionLevel}`);
        // console.log(`  - Structure Gen MaxDepth (from command): ${structureGenOptionsForBrick.maxDepth}`);


        if (finalIncludeProjectTree) {
            // const resolvedMaxDepth = this.resolveOptionalNumberOption(
            //     brick.options, // Inutilisé pour maxDepth actuellement pour la brique
            //     project.options,
            //     'defaultBrickIncludeProjectTreeMaxDepth'
            // ) ?? 7; // Fallback si non défini dans projet (devrait l'être)

            // Utiliser le maxDepth fourni dans structureGenOptionsForBrick
            // car il a été calculé en amont avec toutes les options pertinentes.
            const optionsForThisBrickTree: StructureGenerationOptions = {
                ...structureGenOptionsForBrick, // Contient déjà le shouldIgnore
                // maxDepth: structureGenOptionsForBrick.maxDepth // Déjà dedans
            };
            
            // console.log(`  - Generating project tree with maxDepth: ${optionsForThisBrickTree.maxDepth}`);
            const report: GenerationReport | null = await this.structureGenerationService.generate(
                project.projectRootPath,
                optionsForThisBrickTree 
            );
            if (report?.tree) {
                outputParts.push('--- PROJECT TREE ---');
                outputParts.push(report.tree);
            }
        }
        
        // --- SECTION FICHIERS ---
        if (brick.files_scope && brick.files_scope.length > 0) {
            const fileContents = await this.fileContentService.buildContentFromFiles(
                brick.files_scope,
                project.projectRootPath,
                finalCompressionLevel
            );
            outputParts.push('--- FILE CONTENTS ---');
            outputParts.push(fileContents);
        } else {
            outputParts.push('--- FILE CONTENTS ---\n(No content from files_scope or all files were empty/unreadable)');
        }
        
        return outputParts.join('\n\n').trim();
    }
}