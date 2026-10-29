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

import * as vscode from "vscode";
import { spawn, ChildProcess } from "child_process";

export interface PtySimulatorParams {
    name: string;
    nodeEntryPointModule: string;
    args: string[];
    location?: vscode.TerminalEditorLocationOptions;
}

// This helper function creates a pseudo-terminal that is backed by
// VS Code's internal Electron Node.js engine (using `ELECTRON_RUN_AS_NODE`).
// While creating a simple terminal with `ELECTRON_RUN_AS_NODE` works on POSIX
// systems, it doesn't work on Windows, because `Code.exe` is built as a GUI-subsystem
// executable, such that (it appears) the created process won't have TTY support, even with
// `ELECTRON_RUN_AS_NODE=1`. So the only way around that limitation is to create
// a pseudo-terminal like we do here, and import a shim at the top of our
// `nodeEntryPointModule` module. The shim (see `wasm/pseudo-terminal-tty-shim.mjs`)
// is required to trick the child process into believing it has a legit TTY for stdin.
export function createNodeBackedPseudoTerminal({ name, args, location, nodeEntryPointModule }: PtySimulatorParams): vscode.Terminal {
    const writeEmitter = new vscode.EventEmitter<string>();
    const closeEmitter = new vscode.EventEmitter<number | void>();
    let child: ChildProcess | undefined;
    let closing = false;
    let dims = { columns: 80, rows: 24 };

    const toTerminal = (s: string) => s.replace(/\r?\n/g, "\r\n");
    const print = (s: string) => writeEmitter.fire(toTerminal(s));

    const pty: vscode.Pseudoterminal = {
        onDidWrite: writeEmitter.event,
        onDidClose: closeEmitter.event,
        open(initialDims) {
            if (initialDims) {
                dims = initialDims;
            }

            child = spawn(
                process.execPath,
                [nodeEntryPointModule, ...args],
                {
                    env: {
                        ...process.env,
                        ELECTRON_RUN_AS_NODE: "1",
                        SIM_MUST_INCLUDE_SHIM: "true", // This is used by the runner module to determine whether to import the "shim", such that the runner can still be used with a normal Node.js installation, if ever needed.
                        SIM_COLS: String(dims.columns),
                        SIM_ROWS: String(dims.rows),
                    },
                    stdio: ["pipe", "pipe", "pipe", "ipc"],
                    windowsHide: true,
                }
            );

            child.stdout!.setEncoding("utf8");
            child.stderr!.setEncoding("utf8");

            // Pipes don't translate \n to \r\n like a real TTY does.
            const forward = (s: string) => writeEmitter.fire(toTerminal(s));
            child.stdout!.on("data", forward);
            child.stderr!.on("data", forward);

            child.stdin!.on("error", () => { /* child exited; ignore EPIPE */ });

            child.on("error", (e) => print(`Failed to start node-backed pseudo-terminal: ${e.message}\n`));

            child.on("exit", (code, signal) => {
                child = undefined;
                if (closing) { return; }
                if (code === 0) {
                    closeEmitter.fire(0);
                } else {
                    print(`\n[node-backed pseudo-terminal exited with ${signal ?? `code ${code}`}]\n`);
                }
            });
        },
        handleInput(data) {
            child?.stdin?.write(data);
        },
        setDimensions(d) {
            dims = d;
            if (child?.connected) {
                child.send({ type: "resize", columns: d.columns, rows: d.rows });
            }
        },
        close() {
            closing = true;
            child?.kill();
        }
    };

    return vscode.window.createTerminal({
        name,
        pty,
        location
    });
}