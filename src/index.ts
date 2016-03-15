///<reference path="../typings/main.d.ts" />

import * as ts from "typescript";

function compile(filenames: Array<string>, options: ts.CompilerOptions): void {
	let host = getCompilerHost(options);
	let program = ts.createProgram(filenames, options);
	let emitResult = program.emit();
	let allDiags = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
	let tcheck = program.getTypeChecker();
	let rootFiles = program.getRootFileNames();

	console.log("Hello World");

	rootFiles.forEach((val) => {
		console.log("root file names");
		const rootNode = program.getSourceFile(val);
		console.log(`${rootNode}`);
	});

	allDiags.forEach(diagnostic => {
		let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
		let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
		console.log(`${diagnostic.file.fileName} (${line + 1}, ${character + 1}): ${message}`);
	});

	let exitCode = emitResult.emitSkipped ? 1 : 0;
	console.log(`Process exiting with '${exitCode}'.`);
	process.exit(exitCode);
}

function getCompilerHost(options: ts.CompilerOptions): ts.CompilerHost {
	return {
		readFile: (filename: string) => {return undefined},
		fileExists: (filename: string) => {return undefined},
		getSourceFile: (filepath: string) => {return undefined},
		writeFile: () => {},
		getNewLine: () => {return undefined},
		getCurrentDirectory: () => {return undefined},
		getDefaultLibFileName: () => {return undefined},
		getCanonicalFileName: (filename: string) => {return undefined},
		useCaseSensitiveFileNames: () => {return undefined}
	};
}

compile(process.argv.slice(2), {
	noEmitOnError: true,
	noImplicitAny: true,
	target: ts.ScriptTarget.ES5,
	module: ts.ModuleKind.CommonJS
});
