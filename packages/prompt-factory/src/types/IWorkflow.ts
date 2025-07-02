// packages/prompt-factory/src/types/IWorkflow.ts
export interface IWorkflow<T, U> {
    execute(context: T): Promise<U>;
  }
  
  // packages/prompt-factory/src/types/IAnalyzer.ts
  import { JabbarProject } from '@jabbarroot/core';
  export interface IAnalyzer<T> {
    analyze(project: JabbarProject, ...args: any[]): Promise<T>;
  }
  
  // packages/prompt-factory/src/types/ISynthesizer.ts
  export interface ISynthesizer<T, U> {
    synthesize(context: T, ...args: any[]): Promise<U>;
  }