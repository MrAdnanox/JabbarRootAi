// apps/vscode-extension/src/core/mcp-system-servers.config.ts
import { MCPServerDefinition } from '@jabbarroot/types';

export const SYSTEM_MCP_SERVERS: MCPServerDefinition[] = [
  {
    id: 'context7',
    name: 'Context7 (Documentation)',
    description: 'Injecte la documentation de bibliothèques à jour.',
    protocol: 'ipc', // Le protocole est stdio/ipc
    run: {
      command: 'npx',
      // ZÉRO ARGUMENT SUPPLÉMENTAIRE
      args: ['-y', '@upstash/context7-mcp@latest']
    }
  },
];