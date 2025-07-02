export type AgentInputSourceType = 'artefact' | 'memory';
export type AgentOutputType = 'file' | 'artefact' | 'clipboard';

export interface AgentInputSource {
  type: AgentInputSourceType;
  name: string; // Nom de la brique (ex: "[ARTEFACT] Architectural Report")
}

export interface AgentOutput {
  type: AgentOutputType;
  target: string; // Chemin du fichier, ou nom de la brique d'artefact
  language?: string;
}

export interface AgentDefinition {
  id: string;
  commandId: string;
  label: string;
  description: string;
  promptFile: string;
  inputSources: AgentInputSource[];
  output: AgentOutput;
}

export interface AgentManifest {
  version: string;
  agents: AgentDefinition[];
}
