// packages/prompt-factory/src/services/orchestration/resilience/RetryWithBackoff.ts
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class RetryWithBackoff {
  constructor(
    private readonly maxRetries: number = 3,
    private readonly initialDelay: number = 100, // ms
    private readonly factor: number = 2 // exponential backoff
  ) {}

  public async execute<T>(asyncFunction: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    let currentDelay = this.initialDelay;

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        return await asyncFunction();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`[Retry] Attempt ${i + 1}/${this.maxRetries} failed: ${lastError.message}. Retrying in ${currentDelay}ms...`);
        await delay(currentDelay);
        currentDelay *= this.factor;
      }
    }
    throw new Error(`[Retry] Operation failed after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
  }
}