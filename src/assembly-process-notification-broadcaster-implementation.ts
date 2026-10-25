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
import { AssemblyProcessNotificationBroadcaster } from "./interfaces";
import { CONFIG_NOTIFY_ON_ASSEMBLED, CONFIG_PREFIX } from "./constants";

type NotifyOnAssembled = "never" | "showBanner" | "revealFile";

const getConfig = (configurationScope: vscode.ConfigurationScope): NotifyOnAssembled => {
    const config = vscode.workspace.getConfiguration(CONFIG_PREFIX, configurationScope);
    return config.get<NotifyOnAssembled>(CONFIG_NOTIFY_ON_ASSEMBLED, "never");
};

export class NotificationBroadcaster implements AssemblyProcessNotificationBroadcaster {
    broadcastObjectFileCreated(uri: vscode.Uri, configurationScope: vscode.ConfigurationScope): void {
        const config = getConfig(configurationScope);
        switch (config) {
            case "never":
                return;
            case "showBanner":
                vscode.window.showInformationMessage(`Successfully assembled ${uri.fsPath}`, "Open").then(result => {
                    if (result === "Open") {
                        return vscode.commands.executeCommand("vscode.open", uri);
                    } else {
                        return undefined;
                    }
                });
                return;
            case "revealFile":
                vscode.commands.executeCommand("vscode.open", uri);
                return;
            default:
                config satisfies never;
        }
    }
}