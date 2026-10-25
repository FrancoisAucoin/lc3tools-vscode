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

export const DOCS = `## RTI
### *Return from Trap or Interrupt*

**Assembler Format**

    RTI

**Encoding**

| [15...12] | [11...0] |
| :---: | :---: |
| 1000 | 000000000000 |

**Operation**
\`\`\`text
if (PSR[15] == 1) {
    initiatePrivilegeException();
} else {
    PC = mem[R6];
    R6 = R6 + 1;
    TEMP = mem[R6];
    R6 = R6 + 1;
    PSR = TEMP;
    if (PSR[15] == 1) {
        savedSSP = R6;
        R6 = savedUSP;
    }
}
\`\`\`

**Description**

Restores processor state following an interrupt, trap, or exception handler:

* **Privilege Check:** Triggers a privilege mode exception if executed while the processor is in User mode (\`PSR[15] == 1\`).
* **Stack Pop Sequence:** When executing in Supervisor mode, pops the top two words from the system stack to restore the program counter (\`PC\`) and processor status register (\`PSR\`).
* **Mode Switch:** If the restored \`PSR\` indicates a transition back to User mode, the current system stack pointer (\`R6\`) is saved, and \`R6\` is reloaded with the user stack pointer.

**Examples**
\`\`\`${LANGUAGE_ID}
    RTI    ; Restore PC and PSR by popping values off the supervisor stack
\`\`\`

**Reference**

${buildMarkdownLink(`Appendix A, Page 669`)}

**Note**

Serves as the terminal instruction for interrupt, trap, and exception service routines, handing control flow back to the interrupted or calling routine. 

Execution flow operates via a symmetrical stack protocol:
* **Entry:** Prior to running a service routine, the hardware pushes the current \`PSR\` and \`PC\` onto the system stack, shifts the processor into supervisor privilege mode, and loads the service routine's starting vector.
* **Exit (\`RTI\`):** Pops the saved execution context off the stack. Depending on the event type, the restored \`PC\` points either to the instruction following a trap, the next instruction after an interrupt, or the target instruction required to handle/retry an exception.

For comprehensive architectural details on trap and interrupt handling mechanics, consult Section A.3 of Patt & Patel's book.

`;