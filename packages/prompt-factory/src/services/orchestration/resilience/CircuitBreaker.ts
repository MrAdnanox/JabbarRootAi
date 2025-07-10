// packages/prompt-factory/src/services/orchestration/resilience/CircuitBreaker.ts
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly failureThreshold: number = 3, 
    private readonly resetTimeout: number = 10000 // 10 seconds
  ) {}

  public async execute<T>(asyncFunction: () => Promise<T>): Promise<T> {
    switch (this.state) {
      case 'OPEN':
        throw new Error('Circuit Breaker is open. Call blocked.');
      case 'HALF_OPEN':
        try {
          const result = await asyncFunction();
          this.close();
          return result;
        } catch (error) {
          this.open();
          throw error;
        }
      case 'CLOSED':
      default:
        try {
          const result = await asyncFunction();
          this.reset();
          return result;
        } catch (error) {
          this.recordFailure();
          throw error;
        }
    }
  }

  private open(): void {
    this.state = 'OPEN';
    this.lastFailureTime = Date.now();
    console.warn(`[CircuitBreaker] State changed to OPEN. Blocking calls for ${this.resetTimeout}ms.`);
    this.resetTimer = setTimeout(() => {
      this.state = 'HALF_OPEN';
      console.log('[CircuitBreaker] State changed to HALF_OPEN. Allowing one test call.');
    }, this.resetTimeout);
  }

  private close(): void {
    this.state = 'CLOSED';
    this.reset();
    console.log('[CircuitBreaker] State changed to CLOSED. Calls are now allowed.');
  }

  private reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.open();
    }
  }
  
  public getState(): CircuitState {
    return this.state;
  }
}