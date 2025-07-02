export interface CompactionInput {
  readonly path: string;
  readonly content: string;
}

export interface ICompactor {
  compact(content: string): Promise<string>;
}