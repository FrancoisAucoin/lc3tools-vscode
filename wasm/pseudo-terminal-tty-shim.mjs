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

// This file is a shim used to perform some TTY-related
// monkey-patching. It is intended to be imported as
// a Node.js module at the top of our `./lc3tools-run-simulator.mjs`
// to overcome a limitation when running VS Code (i.e., Electron)
// as standalone Node.js on Windows systems. While the practice of directly
// spawning VS Code as a "console process" (using `ELECTRON_RUN_AS_NODE: "1"`)
// flawlessly works on POSIX, it isn't so simple on Windows. The reason apparently
// has to do with the fact that, on Windows, `Code.exe` belongs to the "GUI subsystem"
// class, which affects how the process gets configured when spawned. So here
// we monkey-patch the process's stream objects to "fake" TTY. The runner module
// then check whether `process.env.SIM_MUST_INCLUDE_SHIM` is defined, in which case
// it dynamically imports this module.

const { stdin, stdout, stderr } = process;

stdin.isTTY = true;
stdin.isRaw = false;
stdin.setRawMode = (mode) => {
    stdin.isRaw = !!mode;
    return stdin;
};

for (const s of [stdout, stderr]) {
    s.isTTY = true;
    s.columns = Number(process.env.SIM_COLS) || 80;
    s.rows = Number(process.env.SIM_ROWS) || 24;
    s.getColorDepth = () => 8;
    s.hasColors = () => true;
}

// Optional "live resize" (only works if the child has an IPC channel)
process.on?.("message", (m) => {
    if (m?.type === "resize") {
        for (const s of [stdout, stderr]) { s.columns = m.columns; s.rows = m.rows; }
        stdout.emit("resize");
    }
});