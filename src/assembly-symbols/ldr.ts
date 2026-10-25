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

export const DOCS = `## LDR
### *Load Base+offset*

**Assembler Format**

    LDR  DR,BaseR,offset6

**Encoding**

| [15...12] | [11...9] | [8...6] | [5...0] |
| :---: | :---: | :---: | :---: |
| 0110 | DR | BaseR | offset6 |

**Operation**
\`\`\`text
if (isAddressPrivileged(BaseR + SEXT(offset6)) && PSR[15] == 1) {
    initiateACVException();
} else {
    DR = mem[BaseR + SEXT(offset6)];
    setCC(DR);
}
\`\`\`

**Description**

Computes a memory address by adding the sign-extended 6-bit offset (\`offset6\`) to the contents of the specified base register (**BaseR**).

* **Access Control:** Triggers an Access Control Violation (ACV) exception if the calculated address points to protected supervisor memory while the processor operates in user mode (\`PSR[15] == 1\`).
* **Load Operation:** Otherwise, fetches the 16-bit word from the target address and loads it into destination register **DR**.

Updates the condition codes (N, Z, P) based on whether the loaded value is negative, zero, or positive.

**Examples**
\`\`\`${LANGUAGE_ID}
    LDR R4,R2,#-5    ; Load word from R2 base plus offset into R4 (i.e., mem[R2 - 5] into R4)
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 665`)}

`;

export const SNIPPET: string = `\t\${1:DR},\${2:BaseR},\${3:offset6}`;