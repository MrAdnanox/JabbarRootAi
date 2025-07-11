// apps/vscode-extension/src/services/mcpManager.service.ts
import * as vscode from 'vscode';
import * as path from 'path';
import { IFileSystem, ManagedMCPServer, MCPServerDefinition, MCPServerState } from '@jabbarroot/types';
import { SYSTEM_MCP_SERVERS } from '../core/mcp-system-servers.config';

const USER_SERVERS_PATH = '.jabbarroot/mcp-servers.jsonc';
const STATE_PATH = '.jabbarroot/workspace-state.jsonc';

export class McpManagerService {
  constructor(
    private readonly fs: IFileSystem,
    private readonly workspaceRoot: string
  ) {}

  private async readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
    try {
      const fullPath = path.join(this.workspaceRoot, filePath);
      const content = await this.fs.readFile(fullPath);
      // Gérer les commentaires JSONC
      return JSON.parse(content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''));
    } catch (error) {
      return defaultValue;
    }
  }

  public async getAllServers(): Promise<ManagedMCPServer[]> {
    const userServerDefs = await this.readJsonFile<{ mcpServers: Record<string, Omit<MCPServerDefinition, 'id' | 'name'>> }>
      (USER_SERVERS_PATH, { mcpServers: {} });
    
    const serverStates = await this.readJsonFile<{ mcpServerStates: Record<string, MCPServerState> }>
      (STATE_PATH, { mcpServerStates: {} });

    const managedServers: ManagedMCPServer[] = [];

    // Traiter les serveurs système
    for (const sysDef of SYSTEM_MCP_SERVERS) {
      managedServers.push({
        ...sysDef,
        type: 'system',
        state: serverStates.mcpServerStates[sysDef.id] || { enabled: true } // Activé par défaut
      });
    }

    // Traiter les serveurs utilisateur
    for (const [id, def] of Object.entries(userServerDefs.mcpServers)) {
        // VERSION CORRIGÉE
        managedServers.push({
          id,
          name: id,
          ...def, // 1. D'abord, on décompose les propriétés définies par l'utilisateur
          description: def.description || `Serveur utilisateur : ${def.run.command}`, // 2. On utilise sa description, ou on en génère une si absente
          type: 'user',
          state: serverStates.mcpServerStates[id] || { enabled: false }
        });
    }

    return managedServers;
  }
}