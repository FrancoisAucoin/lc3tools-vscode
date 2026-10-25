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

export const DOCS = `## LDI
### *Load Indirect*

**Assembler Format**

    LDI  DR,LABEL

**Encoding**

| [15...12] | [11...9] | [8...0] |
| :---: | :---: | :---: |
| 1010 | DR | PCoffset9 |

**Operation**
\`\`\`text
if (isAddressOrDerivedAddressPrivileged(ptrAddress) && PSR[15] == 1) {
    initiateACVException();
} else {
    DR = mem[mem[PC_incremented + SEXT(PCoffset9)]];
    setCC(DR);
}
\`\`\`

**Description**

Performs an indirect memory load by resolving a pointer stored at a calculated location:

* **Pointer Calculation:** Computes an initial address by sign-extending the 9-bit offset (\`PCoffset9\`) and adding it to the incremented program counter. This location holds the target address.
* **Access Control:** Triggers an Access Control Violation (ACV) exception if either the pointer address or target memory location resides in protected supervisor memory while operating in user mode (\`PSR[15] == 1\`).
* **Data Retrieval:** Fetches the final 16-bit word from the target address and stores it in destination register **DR**.

Updates the condition codes (N, Z, P) based on whether the loaded value is negative, zero, or positive.

**Examples**
\`\`\`${LANGUAGE_ID}
    LDI R4,LABEL    ; Load word from pointer address into R4 (i.e., mem[mem[LABEL]] into R4)
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 664`)}

`;

export const SNIPPET: string = `\t\${1:DR},\${2:LABEL}`;