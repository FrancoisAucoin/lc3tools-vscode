# 0.1.2

* While the previous patch did fix the Wasm assembler on Windows, the Wasm simulator still wasn't working. This new update aims at fixing that. The likely cause is the direct use of `process.execPath` as a Node.js executable. While that works on POSIX systems, I am now realizing that Windows works differently in that regard (i.e., console vs GUI), and that, on Windows, I need to use the `node.exe` binary that is bundled alongside the `Code.exe` binary pointed to by `process.execPath`.

# 0.1.1

* Working at solving a bug on Windows, where neither the assembler nor the simulator works. It looks like a path-related issue with the loading of the Emscripten modules. It appears that the `import` function in Node.js expects a file URL. While the absolute path works on UNIX systems (given that it's a valid URL component), it likely doesn't on Windows because of the drive prefix (e.g., `C:`).

# 0.1.0

* Added basic support for "binary" text file format.
* Fixed a few typos.
* Updated the documentation.
* Disabled auto-formatting upon symbol completion (because of issue).
* Fixed the "bad usage" occurrences of a regular expression pattern used for matching file extensions.
* Added temporary, low-effort icons for `.lc3-asm/.asm` and `.lc3-bin/.bin` files.
* Replaced `"some string".split("\n")` with `"some-string".split(/\r?\n/)` to avoid potential issues on Windows.
* Added a check for `document.eol === vscode.EndOfLine.CRLF` in the formatter. If `true`, we now do `formattedText = formattedText.replace(/\n/g, "\r\n");` to avoid potential issues on Windows.

# 0.0.1

* Initial release.