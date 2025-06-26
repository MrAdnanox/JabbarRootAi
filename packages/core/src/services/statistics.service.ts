// packages/core/src/services/statistics.service.ts

import { BrickContext } from '../models/project.types';
import { ContextStats } from '../models/contextStats';
import { BrickConstructorService } from './brickConstructor.service';
import { StructureGenerationOptions } from './structureGeneration.service';
import { calculateRawStats } from './statistics/statistics.calculator';
import { getMotivationMessage } from './statistics/statistics.formatter';

export class StatisticsService {
  constructor(private brickConstructor: BrickConstructorService) {}

  public async calculateBrickStats(
    brick: BrickContext,
    project: { projectRootPath: string; options: any },
    structureGenOptions: StructureGenerationOptions
  ): Promise<ContextStats> {
    // 1. Créer une copie des options de génération pour la version non compressée
    const noCompressionOptions = {
      ...structureGenOptions,
      // Forcer la non-compression pour le contenu original
      compressionLevel: 'none' as const
    };

    // 2. Obtenir le contenu original sans compression
    const originalContent = await this.brickConstructor.compileBrick(
      brick,
      project as any, // Conversion de type car on n'utilise que les champs nécessaires
      noCompressionOptions
    );

    // 3. Obtenir le contenu final avec la compression réelle
    const compressedContent = await this.brickConstructor.compileBrick(
      brick,
      project as any,
      structureGenOptions
    );

    // 4. Calculer les statistiques brutes
    const rawStats = calculateRawStats(originalContent, compressedContent);

    // 5. Générer le message de motivation
    const motivation = getMotivationMessage(rawStats.reductionPercent);

    // 6. Retourner les statistiques complètes
    return {
      ...rawStats,
      motivation,
    };
  }

  // Méthode utilitaire pour les statistiques d'un ensemble de briques
  public async calculateCombinedBricksStats(
    bricks: BrickContext[],
    project: { projectRootPath: string; options: any },
    structureGenOptions: StructureGenerationOptions
  ): Promise<ContextStats> {
    // Implémentation similaire mais pour plusieurs briques combinées
    // ...
    throw new Error('Not implemented');
  }
}