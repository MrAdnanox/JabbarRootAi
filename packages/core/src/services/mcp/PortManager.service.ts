// packages/core/src/services/mcp/PortManager.service.ts
import getPort from 'get-port';

export class PortManagerService {
  private acquiredPorts: Set<number> = new Set();

  public async acquirePort(): Promise<number> {
    const port = await getPort();
    this.acquiredPorts.add(port);
    return port;
  }

  public releasePort(port: number): void {
    this.acquiredPorts.delete(port);
  }

  public getAcquiredPorts(): number[] {
    return Array.from(this.acquiredPorts);
  }
}