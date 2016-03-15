///<reference path="../typings/main.d.ts" />
"use strict";
var ts = require("typescript");
function compile(filenames, options) {
    var program = ts.createProgram(filenames, options);
    var emitResult = program.emit();
    var allDiags = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
    allDiags.forEach(function (diagnostic) {
        var _a = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start), line = _a.line, character = _a.character;
        var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
        console.log(diagnostic.file.fileName + " (" + (line + 1) + ", " + (character + 1) + "): " + message);
    });
    var exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log("Process exiting with code '" + exitCode + "'.");
    process.exit(exitCode);
}
compile(process.argv.slice(2), {
    noEmitOnError: true,
    noImplicitAny: true,
    target: 1 /* ES5 */,
    module: 1 /* CommonJS */
});
