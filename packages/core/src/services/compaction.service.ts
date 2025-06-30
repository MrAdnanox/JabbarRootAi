import { CompactionInput, ICompactor } from './compaction/types';
import { CompressionLevel } from '../models/project.types';
import { getLanguageIdFromPath } from './compaction/utils';
import { RegexCompactor } from './compaction/strategies/RegexCompactor';

export class CompactionService {
  private readonly registry = new Map<string, ICompactor>();

  constructor() {
    this.registerStrategies();
  }

  private registerStrategies(): void {
    // Une seule classe de stratégie, mais configurée pour chaque langage.
    this.registry.set('javascript', new RegexCompactor('js'));
    this.registry.set('typescript', new RegexCompactor('js'));
    this.registry.set('css', new RegexCompactor('css'));
    this.registry.set('html', new RegexCompactor('html'));
    this.registry.set('xml', new RegexCompactor('html'));
    this.registry.set('svg', new RegexCompactor('html'));
    // Les autres utiliseront le fallback par défaut du service.
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
    if (!languageId) return file;

    const strategy = this.registry.get(languageId);
    if (!strategy) return file;

    const compactedContent = await strategy.compact(file.content);
    
    return {
      path: file.path,
      content: compactedContent,
    };
  }

  public async compactFiles(files: CompactionInput[]): Promise<CompactionInput[]> {
    return Promise.all(files.map(file => this.processSingleFile(file)));
  }
}