// packages/core/src/services/context.service.ts
import { IStorage } from '@jabbarroot/types';
import { v4 as uuidv4 } from 'uuid';
import { ProgrammableContext } from '../models/programmableContext.js';

const CONTEXTS_STORAGE_KEY = 'jabbarroot.contexts';

type StoredContexts = Record<string, ProgrammableContext>;

/**
 * Gère le cycle de vie (CRUD) des objets ProgrammableContext.
 * C'est la seule source de vérité pour les contextes.
 */
export class ContextService {
  constructor(private readonly storage: IStorage) {}
  /**
   * Récupère tous les contextes depuis le stockage.
   * @returns Un tableau de ProgrammableContext.
   */
  public async getAllContexts(): Promise<ProgrammableContext[]> {
    const stored = await this.storage.get<StoredContexts>(CONTEXTS_STORAGE_KEY);
    return stored ? Object.values(stored) : [];
  }

  /**
   * Crée un nouveau contexte, le persiste et le retourne.
   * @param name - Le nom du nouveau contexte.
   * @returns Le contexte nouvellement créé.
   */
  public async createContext(name: string): Promise<ProgrammableContext> {
    const stored = await this.storage.get<StoredContexts>(CONTEXTS_STORAGE_KEY) ?? {};

    const newContext: ProgrammableContext = {
      id: uuidv4(),
      name,
      files_scope: [],
      options: {
        include_project_tree: true,
        compression_level: 'standard',
        special_sections: {},
      },
      metadata: {
        createdAt: new Date().toISOString(),
      },
    };

    stored[newContext.id] = newContext;
    await this.storage.update(CONTEXTS_STORAGE_KEY, stored);
    return newContext;
  }

  /**
   * Supprime un contexte par son ID.
   * @param contextId - L'ID du contexte à supprimer.
   */
  public async deleteContext(contextId: string): Promise<void> {
    const stored = await this.storage.get<StoredContexts>(CONTEXTS_STORAGE_KEY);
    if (!stored || !stored[contextId]) {
      return; // Le contexte n'existe pas, rien à faire.
    }

    delete stored[contextId];
    await this.storage.update(CONTEXTS_STORAGE_KEY, stored);
  }
  
  /**
   * Met à jour un contexte existant de manière atomique.
   * @param contextId L'ID du contexte à mettre à jour.
   * @param updates Un objet partiel contenant les champs à modifier.
   * @returns Le contexte mis à jour, ou undefined si non trouvé.
   */
  public async updateContext(
    contextId: string,
    updates: Partial<Omit<ProgrammableContext, 'id' | 'metadata'>>
  ): Promise<ProgrammableContext | undefined> {
    const stored = await this.storage.get<StoredContexts>(CONTEXTS_STORAGE_KEY) ?? {};
    const contextToUpdate = stored[contextId];

    if (!contextToUpdate) {
      console.warn(`[ContextService] Context with id "${contextId}" not found for update.`);
      return undefined;
    }

    // Fusionne les mises à jour avec l'objet existant.
    // `options` doit être fusionné de manière plus profonde.
    const updatedContext: ProgrammableContext = {
      ...contextToUpdate,
      ...updates,
      options: {
        ...contextToUpdate.options,
        ...updates.options,
      },
    };

    stored[contextId] = updatedContext;
    await this.storage.update(CONTEXTS_STORAGE_KEY, stored);
    
    return updatedContext;
  }

}