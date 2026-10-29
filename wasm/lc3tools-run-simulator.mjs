/*
#    Copyright 2026 François Aucoin
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.
*/

// -------------------------------------------------------------------------------------------------------
//                                          ABOUT THIS PROGRAM
// -------------------------------------------------------------------------------------------------------
// This is a very simple Node.js program that allows using the produced Emscripten
// Wasm32 (or Wasm64) Node.js `LC-3 Tools Simulator` module (i.e., the `simulator.mjs`
// Emscripten module and the corresponding `simulator.wasm` Wasm module). This program assumes
// that the object files use the `.obj` file extension. Here is a simple usage example:
// 
// > # This starts the simulator and loads two related object files
// > node /path/to/run-simulator.mjs /path/to/simulator.mjs /path/to/part_1.obj /path/to/part_2.obj
// 
// So basically we run `node` with the first argument being this very program, followed by the
// full path to the Emscripten module, beside which is expected to be found the corresponding
// `.wasm` module, followed by the actual arguments to be passed to the simulator executable itself; 
// i.e., the optional flags to be used and the object files to be loaded.
//
// A FEW NOTES
// - This version of the simulator executable will feel slower than its native counterpart when
// processing instructions. I think this mostly (at least in part) has to do with the fact that
// we are doing a lot of context switching between the host (Node.js) and the guest (the Wasm module),
// coupled with the fact that the simulator is designed to literally behave like the hardware would
// under the LC-3 ISA specification. An example of that is when polling the keyboard device, where the C++ implementation
// literally is "busy waiting", therefore maxing the CPU core it uses at 100%. But using Wasm in Node.js forces that
// down to about 10% (observed on my system), because of how Node.js' event loop works (and probably other factors; I need to
// do a little bit more research on that, to be honest). Regardless, I don't personally think that
// any of this is a problem given that the simulator is an educational tool where speed and performance are not
// what matters most; what matters here is that it works and that the tool can be used to learn and follow along
// with the book's examples.
// - This program currently does not allow to run `node run-simulator.mjs simulator.mjs -h` to get the 
// simulator's usage information. The reason is that it will throw before it gets there, because of my `process.stdin.isTTY === true`
// requirement (see below, in code), which exists to make this program simpler (i.e., I didn't want to spend too much time adding
// `process.stdin.isTTY` checks inside `MyInputManager` and elsewhere).
// But it could easily be done with a bit of willpower. :) In the meantime, here is the usage info:
//
//        usage: simulator [OPTIONS] FILE [FILE...]
//
//        -h,--help              Print this message
//        --print-level=N        Output verbosity [0-9]
//        --ignore-privilege     Ignore access violations
//        --log=file             Output to log file
//
// - The simulator has an internal command called `load`, which, under a native build, can be utilized by the
// user to load additional object files while the simulator is running. This is currently not supported
// here because the files won't exist in memory, since our Emscripten target is only using MEMFS, as visible
// in the source's ./CMakeLists.txt and in this file, where we use `preRun` to manually load the object files'
// data in memory, assigning them temporary names, before executing.
// - This script currently does not support the simulator's `--log` flag, which, under a native build, allows
// the user to specify a file to which the logs should be written, instead of echoing them on
// STDOUT. To make that flag work, we'd have to first identify its use in here (i.e., parse its value), create
// a temporary log file inside the MEMFS while in `preRun`, and make sure to get the logged data and create
// the real file from inside `onMainExited`. Note the use of `onMainExited` instead of `postRun` for that purpose.
// That's because (I think) here we are using `ASYNCIFY`, which causes `postRun` to fire immediately. The
// `onMainExited` imported function was added to allow the guest (Wasm module) to actually signal the host (Node.js
// process) that it has ended, as the use of Emscripten's `ASYNCIFY` changes how things work.
// - By the way, porting the simulator to Emscripten was somewhat of a challenge, given that we have
// what I call "two layers of STDIN", and that Wasm, at least as far as I understand it,
// does not inherently play well with the STDIN concept.
// That's why I had to resort to a few tricks to make this work. It feels a little brittle, but I think
// it's going to be good enough given that our use case, which is educational, is not performance-critical.
// - In this example, we technically wouldn't have to manually compile the Wasm bytes and instantiate the 
// module in two steps. It doesn't hurt, but the approach used here would be all the more interesting in a 
// situation where we needed to create a lot of Wasm instances without each time compiling the module.
// - As already mentioned above, to make this whole thing work (i.e., to make the two layers of STDIN work),
// I had to pull out quite a few tricks; i.e., create and implement imported functions and trampolines, create
// IO hooks with trampolines, configure the Node.js process' STDIN to operate in raw mode, consequently,
// having to create my own "readline" logic, which is somewhat primitive, although it works, etc. In other words,
// while I started this journey with a mindset that this would be a piece of cake, this whole Emscripten porting
// activity turned out to be quite complex for the simulator. That being said, this program could be improved
// on several levels, the terminal's STDIN possibly being the major one. Here, I have implemented the bare minimum
// that would allow for a half-decent user experience. So there are no arrow key navigation and no fancy command
// history, but we do have support for backspaces! And the terminal (mostly) assumes ASCII, but that's fine
// since LC-3 ISA assumes ASCII as well.
// -------------------------------------------------------------------------------------------------------

if (process.env.SIM_MUST_INCLUDE_SHIM) {
    await import("./pseudo-terminal-tty-shim.mjs");
}

if (!process.stdin.isTTY) {
    // NOTE: This requirements causes us to not be allowed, using this script,
    // to call `simulator -h`, but I guess it's OK for now.
    console.error(new Error("Expecting process to be TTY"));
    process.exit(1);
}

import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// NOTE: Using zero here means "execute on next loop event". I think that
// this value should actually remain zero, else the terminal will feel 
// too slow. The problem is that outputting gets delayed because it is
// processed one character at the time by the simulator.
const SLEEP_DURATION_MS = 0;
const FILE_EXTENSION_REGULAR_EXPRESSION = /(\.obj)$/i;

const isObjectFile = (/** @type {string} */arg) => {
    return FILE_EXTENSION_REGULAR_EXPRESSION.test(arg);
}

const modulePath = process.argv[2];
if (!modulePath.endsWith(".mjs")) {
    throw new Error(`Expecting module path to end with '.mjs' but got '${modulePath}'`);
}

const wasmPath = modulePath.replace(/(\.mjs)$/, ".wasm");

// NOTE: I am just now realizing that `import` expects a URL. While using
// the absolute path works on UNIX systems (as the path will resolve to a
// valid URL path component), it won't work on Windows systems, because of
// the directory prefix (e.g., `C:\`). So here (I think) the fix is to create
// a URL for the file and use its `href` property.
const moduleUrl = pathToFileURL(modulePath);

const ModuleFactory = (await import(moduleUrl.href)).default;

const wasmBytes = readFileSync(wasmPath);
const compiledWasmModule = await WebAssembly.compile(wasmBytes);

const myArguments = process.argv.slice(3);

class MyInputManager {
    constructor() {
        /** @type {Array<number>} */
        this.queue = [];
        this.charMode = false;
        this.resolver = null;

        this.configureStdin();
    }
    setState(charMode) {
        if (this.charMode === charMode) {
            return;
        }
        this.charMode = charMode;
        this.queue = [];
    }
    configureStdin() {
        process.stdin.on("data", this.onData.bind(this));
        process.stdin.on("end", () => {
            console.error(new Error("'end' event on STDIN not expected"));
            process.exit(1);
        });
        process.stdin.setRawMode(true);
        process.stdin.resume();
    }
    restoreStdin() {
        process.off("data", this.onData.bind(this));
        process.stdin.setRawMode(false);
        process.stdin.pause();
    }
    resolveSuspension() {
        if (this.resolver) {
            const resolver = this.resolver;
            this.resolver = null;
            resolver();
        }
    }
    onData(chunk) {
        for (const b of chunk) {
            if (b === 3) {
                this.restoreStdin();
                process.exit(130);
            }
            this.queue.push(b);
        }
        this.resolveSuspension();
    }
    async nextByte() {
        while (this.queue.length === 0) {
            await new Promise(r => {
                this.resolver = r;
            });
        }
        return this.queue.shift() ?? null;
    }
    async isCharAvailable() {
        if (this.queue.length === 0) {
            await new Promise(r => setTimeout(() => r(), SLEEP_DURATION_MS));
        }
        return this.queue.length > 0;
    }
    nextByteSync() {
        return this.queue.shift() ?? null;
    }
    async skipEscape() {
        if (this.queue.length === 0) { // ESC keypress
            return;
        }
        const b = this.queue[0];
        if (b === 0x5b) { // '[' -> CSI
            this.queue.shift();
            while (true) {
                const c = await this.nextByte();
                if (c === null || (c >= 0x40 && c <= 0x7e)) { // final byte
                    return;
                }
            }
        } else if (b === 0x4f) { // '0' -> SS3
            this.queue.shift();
            await nextByte();
        }
    }
    async readLine() {
        if (this.charMode) {
            console.error(new Error("'readLine' is not expected to be called in raw mode"));
            process.exit(1);
        }
        /** @type {Array<number>} */
        const line = [];
        while (true) {
            const b = await this.nextByte();
            if (b === null) {
                return line.length ? Uint8Array.from(line) : null;
            }
            if (b === 0x0d || b === 0x0a) {
                process.stdout.write("\n");
                return Uint8Array.from(line);
            }
            if (b === 0x04 && line.length === 0) { // Ctrl-D
                return null;
            }
            if (b === 0x7f || b === 0x08) { // backspace
                if (line.length) {
                    // Drop a whole UTF-8 character (skip continuation bytes)
                    while (line.length && (line.pop() & 0xc0) === 0x80) { }
                    process.stdout.write("\b \b");
                }
                continue;
            }
            // NOTE: These two checks must come last, before the final line push,
            // else they will interfere with Enter, Ctrl-D, etc.
            if (b === 0x1b) { // Arrows keys, Home/End keys, Function keys, etc.
                await this.skipEscape();
                continue;
            }
            if (b < 0x20) { // Other control characters like Tab
                continue;
            }
            line.push(b);
            process.stdout.write(Buffer.from([b]));
        }
    }
}

const lineManager = new MyInputManager();

const myModuleConfig = {};
Object.assign(myModuleConfig, {
    arguments: myArguments.map((arg, i) => {
        if (isObjectFile(arg)) {
            return `/file_${i}.obj`;
        } else {
            return arg;
        }
    }),
    stdinSetInputState: (/** @type {boolean}*/state) => {
        lineManager.setState(state);
    },
    stdinIsCharacterAvailable: async () => {
        return lineManager.isCharAvailable();
    },
    stdinGetNextCharacter: () => {
        return lineManager.nextByteSync();
    },
    myStdout: asciiCode => {
        // WARNING: Here we assume that the simulator will only
        // return ascii codes, which is correct, but if it weren't
        // the case, we'd have to handle UTF-8 using some buffering.
        // Same for stderr below.
        process.stdout.write(String.fromCharCode(asciiCode));
    },
    myStderr: asciiCode => {
        // NOTE: I don't think the simulator even uses STDERR.
        process.stderr.write(String.fromCharCode(asciiCode));
    },
    readLine: async () => {
        return lineManager.readLine();
    },
    instantiateWasm: (imports, successCallback) => {
        WebAssembly
            .instantiate(compiledWasmModule, imports)
            .then((wasmInstance) => {
                successCallback(wasmInstance)
            })
            .catch(error => {
                console.error(error);
                process.exit(1);
            });
        return {};
    },
    preRun: [
        (mod) => {
            myArguments.forEach((filePath, index) => {
                if (isObjectFile(filePath)) {
                    const data = readFileSync(filePath);
                    mod.FS.writeFile(`/file_${index}.obj`, data);
                }
            });
        }
    ],
    // postRun: [], // IMPORTANT: `postRun` is kind of useless when using ASYNCIFY. Instead try using the custom `onMainExited` below.
    onMainExited: (code) => {
        // TODO
        // This function gets called if the program terminates
        // normally (which, in this case, I think is expected
        // to always happen), but I need to check what happens
        // if an exception gets thrown somewhere I don't expect.
        lineManager.restoreStdin();
        // Flush the outputs (why not?)
        process.stdout.write("", () => {
            process.stderr.write("", () => {
                process.exit(code);
            });
        });
    }
});

await ModuleFactory(myModuleConfig);

