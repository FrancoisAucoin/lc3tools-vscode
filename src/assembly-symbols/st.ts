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

export const DOCS = `## ST
### *Store*

**Assembler Format**

    ST  SR,LABEL

**Encoding**

| [15...12] | [11...9] | [8...0] |
| :---: | :---: | :---: |
| 0011 | SR | PCoffset9 |

**Operation**
\`\`\`text
if (isAddressPrivileged(PC_incremented + SEXT(PCoffset9)) && PSR[15] == 1) {
    initiateACVException();
} else {
    mem[PC_incremented + SEXT(PCoffset9)] = SR;
}
\`\`\`

**Description**

Computes a target memory address by sign-extending the 9-bit relative offset (\`PCoffset9\`) and adding it to the incremented program counter.

* **Access Control:** Triggers an Access Control Violation (ACV) exception if the calculated destination address points to protected supervisor memory while the processor is operating in user mode (\`PSR[15] == 1\`).
* **Store Operation:** Otherwise, writes the contents of source register **SR** into the specified memory location.

**Examples**
\`\`\`${LANGUAGE_ID}
    ST  R4,LOCATION    ; Store contents of R4 into memory at LOCATION
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 670`)}

`;

export const SNIPPET: string = `\t\${1:SR},\${2:LABEL}`;