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

import { buildMarkdownLink } from "./common";
import { LANGUAGE_ID } from "../constants";

export const DOCS = `## LD
### *Load*

**Assembler Format**

    LD  DR,LABEL

**Encoding**

| [15...12] | [11...9] | [8...0] |
| :---: | :---: | :---: |
| 0010 | DR | PCoffset9 |

**Operation**
\`\`\`text
if (isAddressPrivileged && PSR[15] == 1) {
    initiateACVException();
} else {
    DR = mem[PC_incremented + SEXT(PCoffset9)];
    setCC(DR);
}
\`\`\`

**Description**

Computes a target memory address by sign-extending the 9-bit offset (\`PCoffset9\`) and adding it to the incremented program counter.

* **Access Control:** Triggers an Access Control Violation (ACV) exception if the target address points to protected supervisor memory while the processor is operating in user mode (\`PSR[15] == 1\`).
* **Load Operation:** Otherwise, fetches the 16-bit word from the specified memory location and stores it in destination register **DR**.

Updates the condition codes (N, Z, P) based on whether the loaded value is negative, zero, or positive.

**Examples**
\`\`\`${LANGUAGE_ID}
    LD  R4,VALUE    ; Load word from memory into R4
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 663`)}

`;

export const SNIPPET: string = `\t\${1:DR},\${2:LABEL}`;