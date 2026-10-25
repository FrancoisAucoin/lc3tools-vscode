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
import {
    registerCommands as registerWasmAssemblyValidationCommands,
    Validator as AssemblyValidatorWasmImplementation
} from "./assembly-validation-using-wasm";
import { AssemblyDiagnosticManager } from "./diagnostics-manager";
import { formatText, registerDocumentFormatter } from "./assembly-formatter";
import { OutputManager } from "./output-manager";
import { registerAssemblyHoverProvider } from "./assembly-hover-provider";
import { registerCompletionProvider } from "./assembly-completion-provider";
import { AssemblyAnalyzer } from "./assembly-analyzer";
import { registerAssemblyDefinitionProvider } from "./assembly-definition-provider";
import { registerAssemblyReferenceProvider } from "./assembly-reference-provider";
import { registerAssemblyLabelRenameProvider } from "./assembly-label-rename-provider";
import { registerAssemblyNavigationProvider } from "./assembly-navigation-provider";
import { WasmAssemblerWorkerClientPool } from "./wasm-assembler-worker";
import { registerCommands as registerTerminalSimulatorCommands } from "./terminal-simulator";
import { registerAssemblyCodeLensProvider } from "./assembly-codelens-provider";
import { NotificationBroadcaster } from "./assembly-process-notification-broadcaster-implementation";

let diagnosticsManager: AssemblyDiagnosticManager | undefined = undefined;
let outputManager: OutputManager | undefined = undefined;
let labelsDataSource: AssemblyAnalyzer | undefined = undefined;
let workerClientPool: WasmAssemblerWorkerClientPool | undefined = undefined;

export function activate(context: vscode.ExtensionContext): void {
    if (workerClientPool) {
        workerClientPool.destroy().then(() => {
            console.log(`Old wasm assembler worker client pool destroyed`);
        });
    }
    workerClientPool = new WasmAssemblerWorkerClientPool(context.extensionPath, 4);

    if (labelsDataSource) {
        labelsDataSource.clear();
    }
    labelsDataSource = new AssemblyAnalyzer(context);

    if (outputManager) {
        outputManager.clear();
    }
    outputManager = new OutputManager(context);

    if (diagnosticsManager) {
        diagnosticsManager.clear();
    }
    diagnosticsManager = new AssemblyDiagnosticManager(context, new AssemblyValidatorWasmImplementation(outputManager, workerClientPool));

    context.subscriptions.push(...registerWasmAssemblyValidationCommands({
        diagnosticsUpdater: diagnosticsManager,
        outputAppender: outputManager,
        clientWorkerPool: workerClientPool,
        assemblyProcessNotificationBroadcaster: new NotificationBroadcaster()
    }));
    context.subscriptions.push(registerDocumentFormatter());
    context.subscriptions.push(registerAssemblyHoverProvider(labelsDataSource, (text: string) => {
        return formatText(text, true); // TODO: This isn't great, but it's OK for now.
    }));
    context.subscriptions.push(registerCompletionProvider(labelsDataSource));
    context.subscriptions.push(registerAssemblyCodeLensProvider(labelsDataSource));
    context.subscriptions.push(registerAssemblyDefinitionProvider(labelsDataSource));
    context.subscriptions.push(registerAssemblyReferenceProvider(labelsDataSource));
    context.subscriptions.push(registerAssemblyLabelRenameProvider(labelsDataSource));
    context.subscriptions.push(registerAssemblyNavigationProvider(labelsDataSource));
    context.subscriptions.push(...registerTerminalSimulatorCommands(context.extensionPath));
}

export function deactivate(): void { }
