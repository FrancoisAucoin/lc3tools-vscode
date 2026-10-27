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