/*
    Copyright 2026 François Aucoin
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import { join as joinPath } from "node:path";
import { Worker } from "node:worker_threads";
import { WASM_ASSEMBLER_NAME, WASM_DIRECTORY, WORKERS_ASSEMBLER_FILE, WORKERS_DIRECTORY } from "./constants";

class WasmAssemblerWorkerClient {
    private assemblerPath: string;
    private workerPath: string;
    private worker?: Worker;
    private resolver?: (result: WasmAssemblerResult) => void;
    constructor(basePath: string) {
        this.assemblerPath = joinPath(basePath, WASM_DIRECTORY, WASM_ASSEMBLER_NAME);
        this.workerPath = joinPath(basePath, WORKERS_DIRECTORY, WORKERS_ASSEMBLER_FILE);
        this.configureWorker();
    }
    private configureWorker(): void {
        this.worker = new Worker(this.workerPath, {
            workerData: {
                assemblerPath: this.assemblerPath
            }
        });

        this.worker.on("message", (result: WasmAssemblerResult) => {
            if (!this.worker) {
                return;
            }
            if (!this.resolver) {
                throw new Error(`Expecting 'resolver' instance`);
            }
            this.resolver(result);
            this.resolver = undefined;
        });

        this.worker.on("error", error => {
            if (!this.worker) {
                return;
            }
            // TODO: does this need handling?
            console.error(error);
        });

        this.worker.on("exit", code => {
            if (!this.worker) {
                return;
            }
            // TODO: does this need handling?
            console.log(`Worker has exited with code: ${code}`);
        });
    }
    get canProcess(): boolean {
        return this.resolver === undefined;
    }
    process(filePath: string, saveFile: boolean): Promise<WasmAssemblerResult> {
        if (!this.worker) {
            throw new Error(`Worker has been destroyed`);
        }
        if (this.resolver) {
            throw new Error(`Please implement a queue`);
        }
        this.worker.postMessage({ filePath, saveFile });
        // TODO: Do I also need a "rejecter" and to call that
        // rejecter if my client gets destroyed?
        // If so, what does it do to my queue? Is it OK to have
        // a promise that never resolves if we don't have it
        // in scope anymore? Likely it is, in which case we
        // don't need to do anything anywhere.
        const promise = new Promise<WasmAssemblerResult>((resolve) => {
            this.resolver = resolve;
        });
        return promise;
    }
    async destroy(): Promise<void> {
        if (!this.worker) {
            throw new Error(`Already destroyed`);
        }
        const worker = this.worker;
        this.worker = undefined;
        try {
            const code = await worker.terminate();
            console.log(`Worker terminated with code: ${code}`);
        } catch (error) {
            console.error(error);
        }
    }
}

export interface WasmAssemblerResult {
    text: string;
    success: boolean;
    data?: Uint8Array;
    createdObjectFilePath?: string;
}

class PromiseQueue {
    private queue: Promise<WasmAssemblerResult> = Promise.resolve({ text: "", success: false });
    enqueue(task: () => Promise<WasmAssemblerResult>): Promise<WasmAssemblerResult> {
        this.queue = this.queue.then(() => task());
        return this.queue;
    }
}

export class WasmAssemblerWorkerClientPool {
    private workers: WasmAssemblerWorkerClient[];
    private queues: PromiseQueue[];
    private nextWorkerIndex: number = 0;
    private _destroyed: boolean = false;
    constructor(basePath: string, private poolSize: number) {
        if (poolSize <= 0 || poolSize > 8) {
            throw new Error(`Expecting pool size between 1 and 8`);
        }
        this.workers = [];
        this.queues = [];
        for (let i = 0; i < poolSize; i++) {
            this.workers.push(new WasmAssemblerWorkerClient(basePath));
            this.queues.push(new PromiseQueue());
        }
    }
    private get destroyed(): boolean {
        return this._destroyed;
    }
    process(filePath: string, saveFile: boolean): Promise<WasmAssemblerResult> {
        if (this.workers.length === 0) {
            throw new Error(`Worker pool has been destroyed`);
        }
        const index = this.nextWorkerIndex;
        this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.poolSize;
        return this.queues[index]!.enqueue(() => {
            // TODO: I need to deal with the fact that the class could have been
            // destroyed.
            if (this.destroyed) { // TODO: Does this make sense?
                return Promise.resolve({ text: "", success: true });
            }
            return this.workers[index]!.process(filePath, saveFile);
        });
    }
    async destroy(): Promise<void> {
        if (this.destroyed) {
            throw new Error(`Already destroyed`);
        }
        this._destroyed = true;
        await Promise.all(this.workers.map(w => w.destroy()));
        this.workers = [];
        this.queues = []; // TODO: is this needed at all?
    }
}