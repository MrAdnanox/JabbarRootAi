// packages/vscode-extension/src/adapters/mementoStorage.adapter.ts

import * as vscode from 'vscode';
import { IStorage } from '@jabbarroot/core';

// Implémente le contrat de stockage du core
export class MementoStorageAdapter implements IStorage {
  constructor(private readonly workspaceState: vscode.Memento) {}

  public async get<T>(key: string): Promise<T | undefined> {
    return this.workspaceState.get<T>(key);
  }

  public async update<T>(key: string, value: T): Promise<void> {
    await this.workspaceState.update(key, value);
  }
}