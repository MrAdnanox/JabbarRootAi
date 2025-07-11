// packages/core/src/services/mcp/ProcessManager.service.ts
import { spawn, ChildProcess } from 'child_process';
import { ManagedMCPServer } from '@jabbarroot/types';

export class ProcessManagerService {
  private runningProcesses: Map<string, ChildProcess> = new Map();

  public startServer(server: ManagedMCPServer): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      if (this.runningProcesses.has(server.id)) {
        const process = this.runningProcesses.get(server.id)!;
        if (!process.killed) {
          return resolve(process);
        }
      }

      const serverProcess = spawn(server.run.command, server.run.args, {
        env: { ...process.env, ...server.run.env },
        detached: true, // Important pour tuer le groupe de processus
      });

      serverProcess.on('error', (err) => {
        console.error(`[ProcessManager] Erreur au lancement du processus ${server.id}:`, err);
        this.runningProcesses.delete(server.id);
        reject(err);
      });
      
      serverProcess.on('exit', (code) => {
          console.log(`[ProcessManager] Processus ${server.id} terminé avec le code ${code}.`);
          this.runningProcesses.delete(server.id);
      });

      this.runningProcesses.set(server.id, serverProcess);
      console.log(`[ProcessManager] Processus ${server.id} (PID: ${serverProcess.pid}) lancé.`);
      // Pour IPC, on considère le processus prêt immédiatement.
      resolve(serverProcess);
    });
  }

  public stopServer(id: string): void {
    const running = this.runningProcesses.get(id);
    if (running && running.pid && !running.killed) {
      try {
        process.kill(-running.pid);
      } catch (e) {
        running.kill();
      }
      this.runningProcesses.delete(id);
    }
  }

  public dispose(): void {
    for (const id of this.runningProcesses.keys()) {
      this.stopServer(id);
    }
  }
}