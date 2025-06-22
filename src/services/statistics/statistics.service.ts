// src/services/statistics/statistics.service.ts

import { ProgrammableContext } from '../../models/programmableContext';
import { ContextStats } from '../../models/contextStats';
import { ContextConstructorService } from '../contextConstructor.service';
import { calculateRawStats } from './statistics.calculator';
import { getMotivationMessage } from './statistics.formatter';

export class StatisticsService {
  constructor(private contextConstructor: ContextConstructorService) {}

  public async calculateStats(context: ProgrammableContext): Promise<ContextStats> {
    // 1. Obtenir le contenu original en forçant la non-compression via le superviseur.
    const originalContent = await this.contextConstructor.compileContext({
      ...context,
      options: { ...context.options, compression_level: 'none' },
    });

    // 2. Obtenir le contenu final en utilisant les vraies options via le même superviseur.
    const compressedContent = await this.contextConstructor.compileContext(context);

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