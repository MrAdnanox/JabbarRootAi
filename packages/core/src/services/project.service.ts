// packages/core/src/services/project.service.ts
import { IStorage } from '@jabbarroot/types';
import { v4 as uuidv4 } from 'uuid';
import { JabbarProject, JabbarProjectOptions } from '../models/project.types'; // Ajuster chemin si besoin

const PROJECTS_STORAGE_KEY_PREFIX = 'project_'; // Pour les clés individuelles
const ALL_PROJECT_IDS_KEY = 'jabbarroot.project_ids'; // Pour lister tous les projets sans tout charger

export class ProjectService {
    constructor(private readonly storage: IStorage) {}

    private getProjectKey(projectId: string): string {
        return `${PROJECTS_STORAGE_KEY_PREFIX}${projectId}`;
    }

    async createProject(
        name: string,
        projectRootPath: string,
        initialOptions: Partial<JabbarProjectOptions> = {}
    ): Promise<JabbarProject> {
        const projectId = uuidv4();
        const now = new Date().toISOString();
        
        // Définition des options par défaut
        const defaultOptions: JabbarProjectOptions = {
            // Options de compilation du projet
            compilationCompressionLevel: 'none',
            compilationIncludeProjectTree: true,
            
            // Options par défaut pour les briques
            defaultBrickCompressionLevel: 'none',
            defaultBrickIncludeProjectTree: true,
            defaultBrickIncludeProjectTreeMaxDepth: 7,
            
            // Options d'ignore
            projectIgnoreFiles: [],
            projectIgnorePatterns: []
        };

        const newProject: JabbarProject = {
            id: projectId,
            name,
            projectRootPath,
            brickContextIds: [],
            options: {
                ...defaultOptions,
                ...initialOptions,
            },
            metadata: { createdAt: now, updatedAt: now },
        };

        await this.storage.update(this.getProjectKey(projectId), newProject);

        // Mettre à jour la liste des IDs de tous les projets
        const allProjectIds = await this.storage.get<string[]>(ALL_PROJECT_IDS_KEY) ?? [];
        if (!allProjectIds.includes(projectId)) {
            allProjectIds.push(projectId);
            await this.storage.update(ALL_PROJECT_IDS_KEY, allProjectIds);
        }
        return newProject;
    }

    async getProject(projectId: string): Promise<JabbarProject | undefined> {
        return this.storage.get<JabbarProject>(this.getProjectKey(projectId));
    }

    async getAllProjects(): Promise<JabbarProject[]> {
        const allProjectIds = await this.storage.get<string[]>(ALL_PROJECT_IDS_KEY) ?? [];
        const projects: JabbarProject[] = [];
        for (const id of allProjectIds) {
            const project = await this.getProject(id);
            if (project) {
                projects.push(project);
            }
        }
        return projects;
    }

    async updateProject(
        projectId: string,
        updates: Partial<Omit<JabbarProject, 'id' | 'metadata' | 'brickContextIds'>> & { options?: Partial<JabbarProjectOptions> }
    ): Promise<JabbarProject | undefined> {
        const project = await this.getProject(projectId);
        if (!project) {
            console.warn(`[ProjectService] Project with id "${projectId}" not found for update.`);
            return undefined;
        }

        const updatedProject: JabbarProject = {
            ...project,
            ...updates,
            options: {
                ...project.options,
                ...(updates.options ?? {}),
            },
            metadata: {
                ...project.metadata,
                updatedAt: new Date().toISOString(),
            },
        };
        await this.storage.update(this.getProjectKey(projectId), updatedProject);
        return updatedProject;
    }

    async deleteProject(projectId: string): Promise<void> {
        // TODO IMPORTANT: Gérer la suppression des briques associées (prochain protocole ou itération)
        // Pour l'instant, suppression simple du projet et de son ID dans la liste globale
        await this.storage.update(this.getProjectKey(projectId), undefined); // Ou une méthode delete dédiée si IStorage l'a

        const allProjectIds = await this.storage.get<string[]>(ALL_PROJECT_IDS_KEY) ?? [];
        const updatedProjectIds = allProjectIds.filter((id: string) => id !== projectId);
        await this.storage.update(ALL_PROJECT_IDS_KEY, updatedProjectIds);
        // console.log(`[ProjectService] Project ${projectId} deleted. Associated bricks NOT YET handled.`);
    }

    async addBrickIdToProject(projectId: string, brickId: string): Promise<void> {
        const project = await this.getProject(projectId);
        if (project && !project.brickContextIds.includes(brickId)) {
            project.brickContextIds.push(brickId);
            project.metadata.updatedAt = new Date().toISOString();
            await this.storage.update(this.getProjectKey(projectId), project);
        }
    }

    async removeBrickIdFromProject(projectId: string, brickId: string): Promise<void> {
        const project = await this.getProject(projectId);
        if (project) {
            project.brickContextIds = project.brickContextIds.filter((id: string) => id !== brickId);
            project.metadata.updatedAt = new Date().toISOString();
            await this.storage.update(this.getProjectKey(projectId), project);
        }
    }
}