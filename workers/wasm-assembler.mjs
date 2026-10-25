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

import { parentPort, workerData } from "node:worker_threads";
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

/** @type {{assemblerPath: string}} */
const { assemblerPath } = workerData;

const ModuleFactory = (await import(`${assemblerPath}.mjs`)).default;

/** @type {Buffer} */
const wasmBytes = readFileSync(`${assemblerPath}.wasm`);

/** @type {WebAssembly.Module} */
const compiledWasmModule = await WebAssembly.compile(wasmBytes);

parentPort.on("message", async (/** @type {{filePath: string, saveFile: boolean}}*/ { filePath, saveFile }) => {
    /** @type {string} */
    let stdout = "";
    /** @type {string} */
    const fileId = randomUUID().replaceAll("-", "");
    /** @type {boolean} */
    let success = true;
    /**  @type {Uint8Array | undefined} */
    let data = undefined;
    /** @type {string} */
    const filePathWithoutPrefix = filePath.replace(/(\.asm)|(\.lc3-asm)$/i, "");
    /** @type {string | undefined} */
    let createdObjectFilePath = undefined;

    try {
        await ModuleFactory({
            // See [Emscripten - Module Object](https://emscripten.org/docs/api_reference/module.html)
            // for more information about the configuration object
            instantiateWasm: (imports, successCallback) => {
                WebAssembly
                    .instantiate(compiledWasmModule, imports)
                    .then((wasmInstance) => {
                        successCallback(wasmInstance)
                    });
                return {};
            },
            print: text => {
                if (stdout) {
                    stdout += `\n`;
                }
                stdout += text;
            },
            printErr: text => { // This is not expected (I don't think that the LC3Tools Assembler uses stderr at all).
                console.error(text);
            },
            arguments: [`/${fileId}.asm`],
            preRun: [(mod) => {
                mod.FS.writeFile(`/${fileId}.asm`, readFileSync(filePath, "utf-8"));
            }],
            postRun: [(mod) => {
                // TODO: Decide whether we should have another flag called `loadData`,
                // in addition to `saveFile`, to avoid passing around data during validation,
                // which does not need the data at all.
                try {
                    data = mod.FS.readFile(`/${fileId}.obj`);
                } catch (error) {
                    console.error(error);
                }

                if (saveFile && data) {
                    try {
                        const newFilePath = `${filePathWithoutPrefix}.obj`;
                        writeFileSync(newFilePath, data);
                        createdObjectFilePath = newFilePath;
                    } catch (error) {
                        console.error(error);
                    }
                }
                // NOTE: Cleaning up is not necessary (actually it is wasteful) because
                // we are not reusing the instances. It would be necessary if we were
                // keeping the instance alive however, but that's not our design for now.
                // mod.FS.unlink(`/${fileId}.asm`);
                // mod.FS.unlink(`/${fileId}.obj`);
            }]
        });
    } catch (error) {
        success = false;
        if (error instanceof WebAssembly.Exception) {
            // This is expected in cases where the assembly process fails, because
            // that's how the LC3Tools simulator has been designed.
        } else {
            // TODO: Check whether this needs handling.
            console.error(error);
        }
    }

    /** @type {string} */
    const text = stdout.replaceAll(`/${fileId}`, filePathWithoutPrefix);

    parentPort.postMessage({ text, success, data, createdObjectFilePath }, data ? [data.buffer] : undefined);
});