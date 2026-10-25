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

export const LANGUAGE_ID = "lc3-isa-asm";
export const EXTENSION_SHORT_NAME = "lc3tools";

export const CONFIG_PREFIX = "lc3Tools";
export const CONFIG_VALIDATE_ON_SAVE = "validateOnSave";
export const CONFIG_CODELENSES_ENABLED = "codeLensesEnabled";
export const CONFIG_FORMATTER_PREFIX = "lc3Tools.formatter";
export const CONFIG_FORMATTER_ENABLED = "enabled";
export const CONFIG_FORMATTER_USE_LOWER_CASE = "useLowerCase";
export const CONFIG_FORMATTER_USE_SPACE_AFTER_COMMAS = "useSpaceAfterCommas";
export const CONFIG_SIMULATOR_PREFIX = "lc3Tools.simulator";
export const CONFIG_SIMULATOR_LOG_LEVEL = "logLevel";
export const CONFIG_SIMULATOR_OPEN_TERMINAL_IN_EDITOR_AREA = "openTerminalInEditorArea";
export const CONFIG_REVEAL_LOGS = "lc3Tools.revealLogs";
export const CONFIG_NOTIFY_ON_ASSEMBLED = "notifyOnAssembled";

export const COMMAND_VALIDATE = "lc3tools.validate";
export const COMMAND_ASSEMBLE = "lc3tools.assemble";
export const COMMAND_RUN_SIMULATOR_FOR_MULTIPLE_SOURCES = "lc3tools.runSimulatorForMultipleSources";
export const COMMAND_RUN_SIMULATOR = "lc3tools.runSimulator";

export const WASM_DIRECTORY = "wasm";
export const WASM_ASSEMBLER_NAME = "lc3tools-assembler";
export const WASM_SIMULATOR_FILE = "lc3tools-simulator.mjs";
export const WASM_SIMULATOR_RUNNER = "lc3tools-run-simulator.mjs";

export const WORKERS_DIRECTORY = "workers";
export const WORKERS_ASSEMBLER_FILE = "wasm-assembler.mjs";
