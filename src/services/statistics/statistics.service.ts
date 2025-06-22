// src/services/statistics/statistics.service.ts

import { ProgrammableContext } from '../../models/programmableContext';
import { ContextStats } from '../../models/contextStats';
import { CompactionService } from '../compactionService';
import { calculateRawStats } from './statistics.calculator';
import { getMotivationMessage } from './statistics.formatter';

export class StatisticsService {
  constructor(private compactionService: CompactionService) {}

  public async calculateStats(context: ProgrammableContext): Promise<ContextStats> {
    // 1. Obtenir les contenus originaux et compressés via le CompactionService
    const originalContent = await this.compactionService.compileContext({
      ...context,
      options: { ...context.options, compression_level: 'none' },
    });
    const compressedContent = await this.compactionService.compileContext(context);

    // 2. Déléguer le calcul brut
    const rawStats = calculateRawStats(originalContent, compressedContent);
    
    // 3. Déléguer le formatage du message
    const motivation = getMotivationMessage(rawStats.reductionPercent);

    // 4. Assembler l'objet final
    return {
      ...rawStats,
      motivation,
    };
  }
}