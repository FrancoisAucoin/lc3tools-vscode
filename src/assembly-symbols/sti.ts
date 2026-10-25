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

export const DOCS = `## STI
### *Store Indirect*

**Assembler Format**

    STI  SR,LABEL

**Encoding**

| [15...12] | [11...9] | [8...0] |
| :---: | :---: | :---: |
| 1011 | SR | PCoffset9 |

**Operation**
\`\`\`text
if (isAddressOrDerivedAddressPrivileged(ptrAddress) && PSR[15] == 1) {
    initiateACVException();
} else {
    mem[mem[PC_incremented + SEXT(PCoffset9)]] = SR;
}
\`\`\`

**Description**

Performs an indirect memory store by writing the contents of source register **SR** to a target address resolved via an intermediate pointer:

* **Pointer Calculation:** Computes an initial address by sign-extending the 9-bit relative offset (\`PCoffset9\`) and adding it to the incremented program counter. This memory location holds the final destination address.
* **Access Control:** Triggers an Access Control Violation (ACV) exception if either the pointer address or the resolved target memory location resides in protected supervisor memory while operating in user mode (\`PSR[15] == 1\`).
* **Store Operation:** Otherwise, writes the value from **SR** into the final target memory address.

**Examples**
\`\`\`${LANGUAGE_ID}
    STI R4,PTR_LOCATION    ; Store contents of R4 into target address via pointer at PTR_LOCATION
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 671`)}

`;

export const SNIPPET: string = `\t\${1:SR},\${2:LABEL}`;