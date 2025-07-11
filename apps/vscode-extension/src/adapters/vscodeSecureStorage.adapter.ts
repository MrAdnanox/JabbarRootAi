// apps/vscode-extension/src/adapters/vscodeSecureStorage.adapter.ts
import * as vscode from 'vscode';
import { ISecureStorage } from '@jabbarroot/types';

export class VscodeSecureStorageAdapter implements ISecureStorage {
    constructor(private readonly secretStorage: vscode.SecretStorage) {}

    async getSecret(key: string): Promise<string | undefined> {
        return await this.secretStorage.get(key);
    }

    async setSecret(key: string, value: string): Promise<void> {
        await this.secretStorage.store(key, value);
    }
}