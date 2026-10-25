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

export const DOCS = `## JSR / JSRR
### *Jump to Subroutine*

**Assembler Formats**

    JSR    LABEL
    JSRR   BaseR

**Encodings**

JSR
| [15...12] | [11] | [10...0] |
| :---: | :---: | :---: |
| 0100 | 1 | PCoffset11 |

JSRR
| [15...12] | [11] | [10...9] | [8...6] | [5...0] |
| :---: | :---: | :---: | :---: | :---: |
| 0100 | 0 | 00 | BaseR | 000000 |

**Operation**
\`\`\`text
TEMP = PC_incremented;
if (bit[11] == 0) {
    PC = BaseR;
} else {
    PC = PC_incremented + SEXT(PCoffset11);
}
R7 = TEMP;
\`\`\`

**Description**

Saves the return address (the incremented PC) to register **R7**, then transfers execution control to the target subroutine address.

* **JSR Instruction (\`bit[11] == 1\`):** Computes the destination address by adding the sign-extended 11-bit offset (\`PCoffset11\`) to the incremented program counter.
* **JSRR Instruction (\`bit[11] == 0\`):** Loads the destination address directly from the specified base register (**BaseR**).

**Examples**
\`\`\`${LANGUAGE_ID}
    JSR  QUEUE    ; Save return address in R7 and branch to QUEUE
    JSRR R3       ; Save return address in R7 and branch to address in R3
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 662`)}

`;

export const SNIPPET: string = `\t\${1:LABEL|BaseR}`;