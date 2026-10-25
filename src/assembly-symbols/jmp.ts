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

export const DOCS = `## JMP / RET
### *Jump / Return from Subroutine*

**Assembler Formats**

    JMP  BaseR
    RET

**Encoding**

JMP
| [15...12] | [11...9] | [8...6] | [5...0] |
| :---: | :---: | :---: | :---: |
| 1100 | 000 | BaseR | 000000 |

RET
| [15...12] | [11...9] | [8...6] | [5...0] |
| :---: | :---: | :---: | :---: |
| 1100 | 000 | 111 | 000000 |

**Operation**
\`\`\`text
PC = BaseR;
\`\`\`

**Description**

Unconditionally transfers execution control to the memory address stored in register **BaseR** (encoded in bits \`[8:6]\`).

* **JMP Instruction:** Loads the contents of any specified base register (**BaseR**) into the program counter (**PC**).
* **RET Instruction:** A designated assembly mnemonic equivalent to \`JMP R7\`. It restores control flow following a subroutine call by loading the return address previously saved in **R7**.

**Examples**
\`\`\`${LANGUAGE_ID}
    JMP  R2    ; Set PC to the address stored in R2
    RET        ; Return from subroutine by setting PC to R7
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 661`)}

`;

export const SNIPPET: string = `\t\${1:BaseR}`;