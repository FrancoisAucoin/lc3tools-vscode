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
import { filterOutTerminalColoringCodes } from "./util";
import { OutputAppender } from "./interfaces";
import { CONFIG_REVEAL_LOGS, EXTENSION_SHORT_NAME } from "./constants";

type RevealLogs = "error" | "always" | "never";

export class OutputManager implements OutputAppender {
    private channel: vscode.LogOutputChannel;
    constructor(context: vscode.ExtensionContext) {
        this.channel = vscode.window.createOutputChannel(EXTENSION_SHORT_NAME, { log: true });
        context.subscriptions.push(this.channel);
    }
    clear(): void {
        this.channel.clear();
    }
    private get revealLogs(): RevealLogs {
        // NOTE: Currently this is a "window" setting.
        const config = vscode.workspace.getConfiguration();
        return config.get<RevealLogs>(CONFIG_REVEAL_LOGS, "never");
    }
    append(text: string, isError: boolean): void {
        const filteredText = filterOutTerminalColoringCodes(text);
        if (isError) {
            this.channel.error(filteredText);
            if (this.revealLogs !== "never") {
                this.channel.show(true);
            }
        } else {
            this.channel.info(filteredText);
            if (this.revealLogs === "always") {
                this.channel.show(true);
            }
        }
    }
}