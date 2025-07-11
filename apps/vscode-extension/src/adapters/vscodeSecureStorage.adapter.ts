// apps/vscode-extension/src/adapters/vscodeSecureStorage.adapter.ts
import * as vscode from 'vscode';
import { ISecureStorage } from '@jabbarroot/types';

export class VscodeSecureStorageAdapter implements ISecureStorage {
    constructor(private readonly secretStorage: vscode.SecretStorage) {}

    async getSecret(key: string): Promise<string | undefined> {
        const MAX_RETRIES = 5;
        const INITIAL_DELAY_MS = 200;
        let currentDelay = INITIAL_DELAY_MS;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[SecureStorageAdapter] Tentative ${attempt}/${MAX_RETRIES} de récupération du secret : '${key}'`);
                const value = await this.secretStorage.get(key);
                
                if (value !== undefined) {
                    console.log(`[SecureStorageAdapter] Secret '${key}' récupéré avec succès.`);
                    return value;
                }
                
                // Si la valeur est undefined, ce n'est pas une erreur, le secret n'existe peut-être pas.
                // On continue d'essayer au cas où ce serait un problème de timing.
                console.log(`[SecureStorageAdapter] Secret '${key}' non trouvé à la tentative ${attempt}. Ce n'est pas une erreur, le secret est peut-être simplement absent.`);

            } catch (error) {
                // Une exception est une véritable erreur système.
                console.error(`[SecureStorageAdapter] Erreur système lors de la tentative ${attempt} de récupération de '${key}':`, error);
            }

            // Attendre avant la prochaine tentative
            if (attempt < MAX_RETRIES) {
                console.log(`[SecureStorageAdapter] Prochaine tentative dans ${currentDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay *= 2; // Exponential backoff
            }
        }

        // Après toutes les tentatives, si on est ici, c'est que le secret est vraiment absent.
        console.warn(`[SecureStorageAdapter] Le secret '${key}' n'a pas été trouvé après ${MAX_RETRIES} tentatives. Il est considéré comme définitivement absent.`);
        return undefined; // Retourner undefined est le comportement correct si le secret n'existe pas.
    }

    async setSecret(key: string, value: string): Promise<void> {
        console.log(`[SecureStorageAdapter] Enregistrement du secret : '${key}'`);
        await this.secretStorage.store(key, value);
        console.log(`[SecureStorageAdapter] Secret '${key}' enregistré avec succès.`);
    }
}