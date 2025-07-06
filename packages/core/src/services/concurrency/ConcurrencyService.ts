// packages/core/src/services/concurrency/ConcurrencyService.ts
// NOUVEAU - Gestion des workers via les worker_threads natifs.
import { Worker } from 'worker_threads';
import * as path from 'path';
import * as os from 'os';

export class ConcurrencyService {
    private readonly poolSize: number;
    private workers: Worker[] = [];
    private taskQueue: any[] = [];
    private activeTasks: number = 0;
    
    // Le chemin du script worker est maintenant injecté
    constructor(private readonly workerScriptPath: string, poolSize?: number) {
        if (!workerScriptPath) {
            throw new Error("[ConcurrencyService] Le chemin du script worker est obligatoire.");
        }
        this.poolSize = poolSize || Math.max(1, os.cpus().length - 1);
        console.log(`[ConcurrencyService] Initialisation avec un pool de ${this.poolSize} workers natifs.`);
        this.initialize();
    }

    private initialize(): void {
        // Utilise le chemin injecté
        for (let i = 0; i < this.poolSize; i++) {
            const worker = new Worker(this.workerScriptPath);
            worker.on('error', (err) => console.error(`[Worker Error]`, err));
            worker.on('exit', (code) => {
                if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
            });
            this.workers.push(worker);
        }
    }
    
    public runTaskInWorker<T>(taskPayload: { filePath: string; fileContent: string; parsersPath: string }): Promise<T> {
        return new Promise((resolve, reject) => {
            const task = { payload: taskPayload, resolve, reject };
            this.taskQueue.push(task);
            this.dispatch();
        });
    }

    private dispatch(): void {
        while (this.activeTasks < this.poolSize && this.taskQueue.length > 0) {
            this.activeTasks++;
            const worker = this.workers.find(w => !w.threadId.toString().includes('active')); // Simple check
            if (worker) {
                const task = this.taskQueue.shift();
                
                worker.once('message', (result) => {
                    if (result.error) {
                        task.reject(new Error(result.error));
                    } else {
                        task.resolve(result);
                    }
                    this.activeTasks--;
                    this.dispatch(); // Check for more tasks
                });

                worker.postMessage(task.payload);
            } else {
                // Tous les workers sont occupés, on attendra la prochaine dispatch
                this.activeTasks--; // Revert increment
                break;
            }
        }
    }

    public dispose(): void {
        console.log('[ConcurrencyService] Arrêt des workers...');
        for (const worker of this.workers) {
            worker.terminate();
        }
    }
}