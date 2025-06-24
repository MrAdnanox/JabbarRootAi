// packages/core/src/services/statistics.service.ts

import { ProgrammableContext } from '../models/programmableContext';
import { ContextStats } from '../models/contextStats';
import { ContextConstructorService } from './contextConstructor.service';
import { StructureGenerationOptions } from './structureGeneration.service';
import { calculateRawStats } from './statistics/statistics.calculator';
import { getMotivationMessage } from './statistics/statistics.formatter';

export class StatisticsService {
  constructor(private contextConstructor: ContextConstructorService) {}

  public async calculateStats(
    context: ProgrammableContext,
    files_scope: string[],
    projectRootPath: string,
    structureGenOptions: StructureGenerationOptions
  ): Promise<ContextStats> {

    // 1. Obtenir le contenu original en forçant la non-compression.
    // On passe tous les arguments, mais on surcharge le niveau de compression.
    const originalContent = await this.contextConstructor.compileContext(
      { ...context, options: { ...context.options, compression_level: 'none' } },
      files_scope,
      projectRootPath,
      structureGenOptions
    );

    // 2. Obtenir le contenu final en utilisant les vraies options.
    const compressedContent = await this.contextConstructor.compileContext(
      context,
      files_scope,
      projectRootPath,
      structureGenOptions
    );

    // 3. Déléguer le calcul brut.
    const rawStats = calculateRawStats(originalContent, compressedContent);

    // 4. Déléguer le formatage du message.
    const motivation = getMotivationMessage(rawStats.reductionPercent);

    // 5. Assembler l'objet final.
    return {
      ...rawStats,
      motivation,
    };
  }
}