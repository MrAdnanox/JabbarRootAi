// NOUVEAU FICHIER : packages/core/src/services/ignore.service.ts
import { IFileSystem } from '@jabbarroot/types';
import { minimatch } from 'minimatch';
import { JabbarProject, BrickContext } from '@jabbarroot/types';
import * as path from 'path';

export class IgnoreService {
    private readonly patternCache = new Map<string, string[]>();
    private readonly DEFAULT_IGNORE = [
        '.git', 'node_modules', 'dist', 'build', 'out', '.vscode',
        '**/*.log', '**/*.tmp', '**/*.bak', '**/*.swp',
        '**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml',
    ];

    constructor(private readonly fs: IFileSystem) {}

    private async loadPatternsFromFile(projectRootPath: string, relativeFilePath: string): Promise<string[]> {
        const cacheKey = `${projectRootPath}:${relativeFilePath}`;
        if (this.patternCache.has(cacheKey)) {
            return this.patternCache.get(cacheKey)!;
        }

        const absoluteFilePath = path.join(projectRootPath, relativeFilePath);
        try {
            const content = await this.fs.readFile(absoluteFilePath);
            const patterns = content
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
            this.patternCache.set(cacheKey, patterns);
            return patterns;
        } catch (error) {
            this.patternCache.set(cacheKey, []); // Cache miss
            return [];
        }
    }

    public async createIgnorePredicate(
        project: JabbarProject,
        brick?: BrickContext
    ): Promise<(relativePath: string) => boolean> {
        const patterns: string[] = [...this.DEFAULT_IGNORE];

        const gitignorePatterns = await this.loadPatternsFromFile(project.projectRootPath, '.gitignore');
        patterns.push(...gitignorePatterns);

        if (project.options.projectIgnorePatterns) {
            patterns.push(...project.options.projectIgnorePatterns);
        }
        if (brick?.options?.brickIgnorePatterns) {
            patterns.push(...brick.options.brickIgnorePatterns);
        }

        const uniquePatterns = [...new Set(patterns.filter(p => p))];

        return (filePathToCheck: string): boolean => {
            const normalizedPath = filePathToCheck.replace(/\\/g, '/');
            for (const pattern of uniquePatterns) {
                if (minimatch(normalizedPath, pattern, { dot: true })) {
                    return true;
                }
            }
            return false;
        };
    }
}