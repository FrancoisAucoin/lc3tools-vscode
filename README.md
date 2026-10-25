# LC3Tools VS Code Extension

This is an experimental VS Code extension that provides support for
the LC-3 ISA Assembly language. The extension bundles [WebAssembly versions](https://github.com/FrancoisAucoin/lc3tools-cmake-port)
of the LC3Tools `assembler` and `simulator` binaries, making it self-contained and therefore requiring no additional
installation steps. The `assembler` is used by the extension to provide validation and let the 
user assemble using a simple command. The `simulator` lets the user launch a session directly inside an
integrated terminal without ever needing to leave VS Code. Simulator sessions can be started from
either a single file or multiple files (either object files or, more conveniently, source files).

**Disclaimer:** This project is not affiliated with the official 
[lc3tools repository](https://github.com/chiragsakhuja/lc3tools/tree/master).

## Features

* Syntax highlighting
* Code validation
* Code formatting
* Code completion and symbol snippets
* Symbol documentation
* Code refactoring (for labels)
* Code navigation (for labels)
* CodeLenses (for labels)
* Code compilation (i.e., assembly)
* Integrated simulator
* Multi-root workspace support

## Previews

### Preview 1: Hello, World!
This is a simple "Hello, World!" preview that illustrates most of the [main features](#features) listed above. _Note that the label CodeLenses are not visible because the feature was implemented after the video was recorded._
<video src="https://raw.githubusercontent.com/FrancoisAucoin/lc3tools-vscode/refs/heads/main/assets/hello.mp4" controls width="100%" muted></video>
    
### Preview 2: Multi-source simulation
This second preview illustrates how to use the "multi-source simulation" feature, which allows starting a simulator session loading multiple related source (or object) files.
<video src="https://raw.githubusercontent.com/FrancoisAucoin/lc3tools-vscode/refs/heads/main/assets/multi-source.mp4" controls width="100%" muted></video>

## Extension Settings

This extension contributes the following settings:

* `lc3Tools.validateOnSave`: Performs validation when opening and saving an LC-3 ISA assembly file.
* `lc3Tools.notifyOnAssembled`: How to notify the user upon successful assembly (i.e., the generation of an object file from the assembly file). The options are `never`, `showBanner`, or `revealFile`.
* `lc3Tools.codeLensesEnabled`: Whether CodeLenses are enabled for labels.
* `lc3Tools.revealLogs`: When to reveal validation-related logs in the OUTPUT panel area. Note that, for now, this is a "window only" setting, and that all workspaces use the same output channel. The options are `never`, `always`, or `error`.
* `lc3Tools.formatter.enabled`: Enables the LC-3 ISA Assembly formatter.
* `lc3Tools.formatter.useLowerCase`: Whether to use lowercase instead of uppercase. This applies to opcodes, pseudo-opcodes, labels, and registers.
* `lc3Tools.formatter.useSpaceAfterCommas`: Whether to use a space after (to the right of) a comma (that separates operands).
* `lc3Tools.simulator.openTerminalInEditorArea`: Whether to open the simulator terminal in the editor area, as opposed to the default TERMINAL area.
* `lc3Tools.simulator.logLevel`: The logging level (corresponding to the LC3Tools simulator's `--print-level` flag) to use for simulator sessions.

## Commands

This extension contributes the following commands:

* **LC3Tools: Run Simulator** ‒ Starts a simulator session for one source or object file. If called from the command palette, the active editor will be used. Alternatively, one can use the contextual button at the top-right corner of the active editor or simply right-click the editor itself to reveal the command. The command can also be triggered for inactive files by using a contextual click on their editor tab or their file explorer item. When working from the file explorer, multiple files (source and object) can be selected at once to trigger a simulator session containing all the corresponding object files. It should be noted that running the simulator for source files will create temporary object files in the background without cluttering the workspace with those files. This command has a contributed key binding defined as `shift+ctrl+r` (or `shift+cmd+r` on macOS).
* **LC3Tools: Run Simulator (Multi-Source)** ‒ Starts a simulator session for multiple related source and object files. This command is similar to the one above, except that it can only be accessed from the command palette. When this command gets triggered, the user is presented with a picker for the current workspace, in which both source files and object files present in that workspace are listed.
* **LC3Tools: Assemble** ‒ Assembles the LC-3 ISA Assembly source file in the active editor. The active editor also shows an icon button in the top-right corner. It's also possible to simply right-click the active editor to reveal the command in the context menu. The command can also be used for non-active files by triggering it through a contextual click on the editor tab or on the explorer item. This command has a contributed key binding defined as `shift+ctrl+b` (or `shift+cmd+b` on macOS).
* **LC3Tools: Validate** ‒ Works in exactly the same way as the `LC3Tools: Assemble` command described above, except that it doesn't produce an object file in the workspace. In most cases, however, this command will automatically get called by the extension upon saving, assembling, or simulating, so most users won't need to explicitly call it. This command has a contributed key binding defined as `shift+ctrl+v` (or `shift+cmd+v` on macOS).

## Known Issues & Limitations

* This extension does not yet support the "binary language"
discussed in Chapter 5 of [Patt & Patel's book](#recommended-reading),
but I will eventually get there.
* Some operations, under specific circumstances, will result in a file being validated twice.
* Some occasional crashes were observed during development, but the root causes
could not be isolated. However, it is not clear whether those crashes had to do with the extension itself or with a poisoned debugger state (in which case the extension itself wouldn't be the problem). Please feel free to [create an issue](https://github.com/FrancoisAucoin/lc3tools-vscode/issues) if you encounter a weird crash.
* The Wasm simulator is noticeably (but not impairingly) slower than the native simulator. The
reasons for that are discussed [here](https://github.com/FrancoisAucoin/lc3tools-cmake-port).
* The simulator's terminal has minimal functionality: just enough to get things to work. It doesn't
support features like arrow navigation and history. The limitations are discussed
in more detail in the link provided just above.
* This one is not an actual issue nor a limitation, but more of a note (for me) for later, when
I have more time to clean things up and do some refactoring. You see, this project started out as a
personal experiment, without a real intention of ever publishing it. It was just me adding things
as I went and experimenting with the various VS Code Extension APIs. So I used quick and dirty
patterns here and there, which, looking back, are far from ideal, although they don't affect the
usability of the extension. Examples of such patterns are the tight coupling with `vscode`,
which makes code reuse and unit-testing impossible without pulling the huge `vscode` runtime.
I am also relying on tight coupling between my classes, and some of those classes are likely too
ambitous in scope and should therefore be broken down into smaller, more specialized classes, etc.
* The codebase still contains several `// TODO` comments, but a lot of those are no longer relevant. I will have to review them all and clean up the obsolete ones and address the valid ones. In the meantime, take them with a grain of salt.

## Experimental Status

This is an experimental project. I have been using this extension
as part of my personal journey throughout [Patt & Patel's book](#recommended-reading)
and it appears to be working fine, as far as my use of it is concerned. But the extension
undoubtedly contains a few bugs that will only get discovered when more people
start using it for different use cases. So please feel free to [create issues](https://github.com/FrancoisAucoin/lc3tools-vscode/issues) as you encounter bugs.

## Recommended Resources & References

* [Introduction to computing systems: from bits & gates to C/C++ & beyond (3rd edition; 2019). Yale N. Patt & Sanjay J. Patel](https://www.mheducation.ca/product/ise-introduction-to-computing-systems-from-bits-gates-to-c-c-beyond-9781260565911-can)
* [Official LC3Tools repository](https://github.com/chiragsakhuja/lc3tools/tree/master)
* [LC3Tools CMake Port repository](https://github.com/FrancoisAucoin/lc3tools-cmake-port/src/bin/simulator/run-simulator.mjs)

## Copyright

Copyright (c) 2026 François Aucoin. All rights reserved.