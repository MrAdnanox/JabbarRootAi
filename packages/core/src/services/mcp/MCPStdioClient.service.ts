// packages/core/src/services/mcp/MCPStdioClient.service.ts
import { ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

interface JsonRpcResponse {
  id: string;
  result?: any;
  error?: { code: number; message: string; };
}

interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export class MCPStdioClient {
  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void; }>();
  private availableTools: MCPTool[] = [];
  private isInitialized = false;

  constructor(private process: ChildProcess, private serverId: string) {
    this.process.stdout?.on('data', (data: Buffer) => {
      const messages = data.toString().split('\n').filter(m => m.trim());
      for (const message of messages) {
        try {
          const response: JsonRpcResponse = JSON.parse(message);
          if (response.id && this.pendingRequests.has(response.id)) {
            const promise = this.pendingRequests.get(response.id)!;
            if (response.error) {
              promise.reject(new Error(response.error.message));
            } else {
              promise.resolve(response.result);
            }
            this.pendingRequests.delete(response.id);
          }
        } catch (e) {
          console.error(`[MCPStdioClient-${this.serverId}] Erreur de parsing JSON:`, e);
        }
      }
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      console.log(`[MCP-LOGS-${this.serverId}] ${data.toString().trim()}`);
    });

    // Initialiser la connexion MCP
    this.initializeMCP();
  }

  private async initializeMCP(): Promise<void> {
    try {
      // Étape 1: Initialiser le serveur MCP
      await this.sendJsonRpcRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'vscode-extension-mcp-client',
          version: '1.0.0'
        }
      });

      // Étape 2: Lister les outils disponibles
      const toolsResponse = await this.sendJsonRpcRequest('tools/list', {});
      this.availableTools = toolsResponse.tools || [];
      
      console.log(`[MCPStdioClient-${this.serverId}] Outils disponibles:`, this.availableTools.map(t => t.name));

      this.isInitialized = true;
    } catch (error) {
      console.error(`[MCPStdioClient-${this.serverId}] Erreur d'initialisation MCP:`, error);
      // Ne pas lancer d'erreur ici pour permettre au reste de l'extension de fonctionner
    }
  }

  private sendJsonRpcRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4();
      const request = { 
        jsonrpc: '2.0', 
        id: requestId, 
        method, 
        params 
      };

      this.pendingRequests.set(requestId, { resolve, reject });

      // JUSTIFICATION : Le délai est augmenté à 60 secondes (60000 ms) pour
      // donner au serveur suffisamment de temps pour des opérations longues
      // comme la récupération de documentation.
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error(`Timeout pour la requête ${method}`));
        }
      }, 60000); // <-- AUGMENTATION À 60 SECONDES

      this.process.stdin?.write(JSON.stringify(request) + '\n', (error) => {
        if (error) {
          clearTimeout(timeout);
          this.pendingRequests.delete(requestId);
          reject(error);
        }
      });
    });
  }

  public async callTool(toolName: string, args: any): Promise<any> {
    if (!this.isInitialized) {
      await this.waitForInitialization(); // Attendre si l'initialisation est en cours
      if (!this.isInitialized) { // Re-vérifier après l'attente
        throw new Error(`Client MCP non initialisé pour ${this.serverId}`);
      }
    }

    const tool = this.availableTools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Outil '${toolName}' non trouvé. Outils disponibles: ${this.availableTools.map(t => t.name).join(', ')}`);
    }

    try {
      const response = await this.sendJsonRpcRequest('tools/call', {
        name: toolName,
        arguments: args
      });

      return response;
    } catch (error) {
      console.error(`[MCPStdioClient-${this.serverId}] Erreur lors de l'appel de l'outil ${toolName}:`, error);
      throw error;
    }
  }

  public async waitForInitialization(): Promise<void> {
    if (this.isInitialized) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkInit = () => {
        if (this.isInitialized) {
          resolve();
        } else if (Date.now() - startTime > 20000) { // Timeout de 20s
          reject(new Error(`Timeout d'attente d'initialisation pour ${this.serverId}`));
        }
        else {
          setTimeout(checkInit, 100);
        }
      };
      checkInit();
    });
  }

  public getAvailableTools(): MCPTool[] {
    return [...this.availableTools];
  }
}