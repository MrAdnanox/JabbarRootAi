import { Worker } from 'worker_threads';
import * as os from 'os';

interface Task {
    payload: any;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

export class ConcurrencyService {
    private readonly poolSize: number;
    private workers: Worker[] = [];
    private availableWorkers: Worker[] = [];
    private taskQueue: Task[] = [];

    constructor(private readonly workerScriptPath: string, poolSize?: number) {
        if (!workerScriptPath) {
            throw new Error("[ConcurrencyService] Le chemin du script worker est obligatoire.");
        }
        this.poolSize = poolSize || Math.max(1, os.cpus().length - 1);
        console.log(`[ConcurrencyService] Initialisation avec un pool de ${this.poolSize} workers.`);
        this.initialize();
    }

    private initialize(): void {
        for (let i = 0; i < this.poolSize; i++) {
            const worker = new Worker(this.workerScriptPath);
            worker.on('error', (err) => {
                console.error(`[Worker Error]`, err);
                // Gérer le cas où un worker meurt
            });
            worker.on('exit', (code) => {
                if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
                // Retirer le worker du pool et potentiellement le remplacer
                this.workers = this.workers.filter(w => w !== worker);
                this.availableWorkers = this.availableWorkers.filter(w => w !== worker);
            });
            this.workers.push(worker);
            this.availableWorkers.push(worker); // Au début, tous les workers sont disponibles
        }
    }

    public runTaskInWorker<T>(taskPayload: any): Promise<T> {
        return new Promise((resolve, reject) => {
            const task: Task = { payload: taskPayload, resolve, reject };
            this.taskQueue.push(task);
            this.dispatch();
        });
    }

    private dispatch(): void {
        // Tant qu'il y a des workers disponibles ET des tâches en attente
        while (this.availableWorkers.length > 0 && this.taskQueue.length > 0) {
            const worker = this.availableWorkers.shift(); // Prend un worker disponible
            if (!worker) continue;

            const task = this.taskQueue.shift(); // Prend une tâche
            if (!task) {
                this.availableWorkers.push(worker); // Remet le worker s'il n'y a pas de tâche
                continue;
            }

            worker.once('message', (result) => {
                if (result && result.error) {
                    task.reject(new Error(`Worker error for ${result.filePath}: ${result.error}`));
                } else {
                    task.resolve(result);
                }
                
                // Le worker a fini, il redevient disponible
                this.availableWorkers.push(worker);
                // On essaie de dispatcher une autre tâche
                this.dispatch();
            });

            worker.postMessage(task.payload);
        }
    }

    public dispose(): void {
        console.log('[ConcurrencyService] Arrêt des workers...');
        for (const worker of this.workers) {
            worker.terminate();
        }
    }
}