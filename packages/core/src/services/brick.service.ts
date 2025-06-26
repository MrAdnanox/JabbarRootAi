// packages/core/src/services/brick.service.ts
import { IStorage } from '@jabbarroot/types';
import { v4 as uuidv4 } from 'uuid';
import { BrickContext, BrickContextOptions } from '../models/project.types'; // Ajuster chemin
// IMPORTANT: Nécessitera ProjectService pour lier la brique au projet
// import { ProjectService } from './project.service'; // Dépendance à gérer (injection ou passage en paramètre)

const BRICKS_STORAGE_KEY_PREFIX = 'brick_';
const ALL_BRICK_IDS_KEY = 'jabbarroot.brick_ids'; // Pour lister toutes les briques

export class BrickService {
    // Si ProjectService est une dépendance, l'injecter ici.
    // constructor(private readonly storage: IStorage, private readonly projectService: ProjectService) {}
    constructor(private readonly storage: IStorage) {}


    private getBrickKey(brickId: string): string {
        return `${BRICKS_STORAGE_KEY_PREFIX}${brickId}`;
    }

    async createBrick(
        projectId: string,
        name: string,
        initialOptions: BrickContextOptions,
        isActiveForProjectCompilation: boolean = true // Default à true
    ): Promise<BrickContext> {
        const brickId = uuidv4();
        const now = new Date().toISOString();
        const newBrick: BrickContext = {
            id: brickId,
            projectId,
            name,
            files_scope: [],
            options: initialOptions,
            isActiveForProjectCompilation,
            metadata: { createdAt: now, updatedAt: now },
        };

        await this.storage.update(this.getBrickKey(brickId), newBrick);

        // Mettre à jour la liste des IDs de toutes les briques
        const allBrickIds = await this.storage.get<string[]>(ALL_BRICK_IDS_KEY) ?? [];
        if (!allBrickIds.includes(brickId)) {
            allBrickIds.push(brickId);
            await this.storage.update(ALL_BRICK_IDS_KEY, allBrickIds);
        }
        
        // IMPORTANT: Lier cette brique à son projet.
        // Cela suppose que ProjectService est disponible.
        // await this.projectService.addBrickIdToProject(projectId, brickId);
        // Pour l'instant, cette responsabilité est laissée à l'appelant ou gérée par une couche d'orchestration.
        // Ou, le ProjectService est injecté et utilisé ici.

        return newBrick;
    }

    async getBrick(brickId: string): Promise<BrickContext | undefined> {
        return this.storage.get<BrickContext>(this.getBrickKey(brickId));
    }

    async getBricksByProjectId(projectId: string): Promise<BrickContext[]> {
        // Avec IStorage plat, on doit charger toutes les briques et filtrer.
        // C'est inefficace si beaucoup de briques.
        // Pour une meilleure perf, il faudrait que ProjectService stocke les IDs des briques (ce qu'il fait),
        // et on utilise ces IDs pour charger uniquement les briques concernées.
        // Alternativement, si ProjectService est injecté, on récupère les IDs du projet puis on charge chaque brique.

        // Pour l'instant, version simple par filtrage de toutes les briques:
        const allBrickIds = await this.storage.get<string[]>(ALL_BRICK_IDS_KEY) ?? [];
        const bricks: BrickContext[] = [];
        for (const id of allBrickIds) {
            const brick = await this.getBrick(id);
            if (brick && brick.projectId === projectId) {
                bricks.push(brick);
            }
        }
        return bricks;
        // NOTE: Une meilleure approche serait que ProjectService (qui connaît les brickContextIds d'un projet)
        // appelle getBrick(id) pour chaque ID de sa liste.
    }

    async updateBrick(
        brickId: string,
        updates: Partial<Omit<BrickContext, 'id' | 'projectId' | 'metadata'>> & { options?: Partial<BrickContextOptions> }
    ): Promise<BrickContext | undefined> {
        const brick = await this.getBrick(brickId);
        if (!brick) {
            console.warn(`[BrickService] Brick with id "${brickId}" not found for update.`);
            return undefined;
        }

        const updatedBrick: BrickContext = {
            ...brick,
            ...updates,
            options: {
                ...brick.options,
                ...(updates.options ?? {}),
            },
            metadata: {
                ...brick.metadata,
                updatedAt: new Date().toISOString(),
            },
        };
        await this.storage.update(this.getBrickKey(brickId), updatedBrick);
        return updatedBrick;
    }

    async deleteBrick(brickId: string): Promise<void> {
        const brick = await this.getBrick(brickId); // Pour obtenir le projectId avant suppression
        if (!brick) return;

        await this.storage.update(this.getBrickKey(brickId), undefined); // Ou delete

        const allBrickIds = await this.storage.get<string[]>(ALL_BRICK_IDS_KEY) ?? [];
        const updatedBrickIds = allBrickIds.filter((id: string) => id !== brickId);
        await this.storage.update(ALL_BRICK_IDS_KEY, updatedBrickIds);

        // IMPORTANT: Délier cette brique de son projet.
        // await this.projectService.removeBrickIdFromProject(brick.projectId, brickId);
        // Encore une fois, dépend de la disponibilité de ProjectService.
        // console.log(`[BrickService] Brick ${brickId} deleted. Unlinking from project ${brick.projectId} NOT YET handled by BrickService directly.`);
    }
}