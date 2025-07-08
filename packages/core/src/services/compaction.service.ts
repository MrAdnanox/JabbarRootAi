import { CompactionInput, ICompactor } from './compaction/types';
import { CompressionLevel } from '@jabbarroot/types';
import { getLanguageIdFromPath } from './compaction/utils';
import { CleanCssCompactor } from './compaction/strategies/CleanCssCompactor';
import { MinifyHtmlCompactor } from './compaction/strategies/MinifyHtmlCompactor';
import { RegexCompactor } from './compaction/strategies/RegexCompactor';

export class CompactionService {
  private readonly registry = new Map<string, ICompactor>();

  constructor() {
    this.registerStrategies();
  }

  private registerStrategies(): void {
    // Stratégie Zéro Dépendance pour JS/TS (le plus sûr)
    const jsCompactor = new RegexCompactor('js');
    this.registry.set('javascript', jsCompactor);
    this.registry.set('typescript', jsCompactor);

    // Stratégie Spécialisée pour CSS
    const cssCompactor = new CleanCssCompactor();
    this.registry.set('css', cssCompactor);
    this.registry.set('scss', cssCompactor);
    this.registry.set('sass', cssCompactor);
    this.registry.set('less', cssCompactor);

    // Stratégie Spécialisée pour HTML
    const htmlCompactor = new MinifyHtmlCompactor();
    this.registry.set('html', htmlCompactor);
    this.registry.set('xml', htmlCompactor);
    this.registry.set('svg', htmlCompactor);
  }

  public async compact(text: string, level: CompressionLevel, filePath: string): Promise<string> {
    const result = await this.processSingleFile({
      path: filePath,
      content: text
    });
    return result.content;
  }

  private async processSingleFile(file: CompactionInput): Promise<CompactionInput> {
    const languageId = getLanguageIdFromPath(file.path);
    if (!languageId) {return file;}

    const strategy = this.registry.get(languageId);
    if (!strategy) {return file;}

    try {
      const compactedContent = await strategy.compact(file.content);
      return {
        path: file.path,
        content: compactedContent,
      };
    } catch (error) {
      console.error(`Error compacting ${file.path}:`, error);
      return file; // Retourne le contenu original en cas d'erreur
    }
  }

  public async compactFiles(files: CompactionInput[]): Promise<CompactionInput[]> {
    return Promise.all(files.map(file => this.processSingleFile(file)));
  }
}