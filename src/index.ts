#!/usr/bin/env node
///<reference path="../typings/main.d.ts" />


import * as ts from "typescript";
import * as fs from "fs";
import * as args from "minimist";

interface cmdOptions {
	_: Array<string>;
	watch: boolean;
};

function compile(filenames: Array<string>, options: ts.CompilerOptions): ts.EmitResult {
	let customCompilerHost = createCompilerHost(options);
	let program = ts.createProgram(filenames, options, customCompilerHost);
	let tcheck = program.getTypeChecker();
	let rootFiles = program.getRootFileNames();

	rootFiles.forEach((val) => {
		console.log(`checking file: ${val}`);
		const rootNode = program.getSourceFile(val);
		testRule(rootNode, tcheck);
	});

	let emitResult = program.emit();
	let allDiags = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

	allDiags.forEach(diagnostic => {
		let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
		let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
		console.log(`${diagnostic.file.fileName} (${line + 1}, ${character + 1}): ${message}`);
	});

	return emitResult;
}

function compileOnce(filenames: Array<string>, options: ts.CompilerOptions): void {
	let emitResult = compile(filenames, options);
	let exitCode = emitResult.emitSkipped ? 1 : 0;
	process.exit(exitCode);
}

function watch(filenames: Array<string>, options: ts.CompilerOptions): void {
	compile(filenames, options);
	filenames.forEach((filename) => {
		fs.watchFile(filename, {persistent: true, interval: 250}, (currStatus, prevStatus) => {
			if(prevStatus.mtime < currStatus.mtime) {
				compile([filename], options);
			} else {
				return;
			}
		});
	});
}

function createCompilerHost(options: ts.CompilerOptions): ts.CompilerHost {
	return {
		readFile: (filename: string) => fs.readFileSync(filename).toString(),
		fileExists: (filename: string) => fs.existsSync(filename),
		getNewLine: () => `\n`,
		useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
		getCanonicalFileName: (filename: string) => ts.sys.useCaseSensitiveFileNames ? filename : filename.toLowerCase(),
		getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
		writeFile: (fname, content) => ts.sys.writeFile(fname, content),
		getDefaultLibFileName: () => "typings/main.d.ts",
		getSourceFile: (filename: string): ts.SourceFile => {
			try {
				return ts.createSourceFile(filename, fs.readFileSync(filename).toString(), options.target, true);
			} catch(e) {
				throw e;
			}
		}
	};
}

function testRule(sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
	processChildNodes(sourceFile, child => {
		if(child.kind === ts.SyntaxKind.IfStatement) {
			checkIfExpression(<ts.IfStatement>child);
		}
		if(child.kind === ts.SyntaxKind.ArrowFunction) {
			checkPromiseHandler(<ts.ArrowFunction>child);
		}
	});

	function checkIfExpression(node: ts.IfStatement) {
		let stype = checker.getTypeAtLocation(node.expression);
		if((stype.flags & ts.TypeFlags.Boolean) !== ts.TypeFlags.Boolean) {
			reportError(node.expression, `If expression is not a boolean`);
		}
	}

	function checkPromiseHandler(node: ts.ArrowFunction) {
		node.parameters.forEach((p: ts.ParameterDeclaration) => {
			let ptype = checker.getTypeAtLocation(p); // Can be made more specific by checking for second parameter
			if(ptype.symbol.getName() === "Error") {
				checkErrorHandler(<ts.Block>node.body, <ts.Declaration>ptype.symbol.valueDeclaration);
			}
		});
	}

	function checkErrorHandler(node: ts.Block, decl: ts.Declaration): void {
		let errorHandled = false;
		ts.forEachChild(node, child => {
			// Complicated logic to check if an If statement exists for handling errors
			// problem is they can be passed into a function as well which can handle the error
			// or they can be throw again. Simple way to test is to check if the err identifier has been used
			// in the function and that should be a decent indicator of if it has been handled.
			// if(child.kind === ts.SyntaxKind.IfStatement) {
			// 	let ifStatement = <ts.IfStatement>child;
			// 	// Check if err is used and if expr says !=== or ===
			// 	// if it says !== then block is a must
			// 	// if it says === else block is a must
			// 	let ifExpr = <ts.BinaryExpression>ifStatement.expression;
			// 	if(ifExpr.getChildAt(0).kind === ts.SyntaxKind.Identifier) {
			// 		if((<ts.Identifier>ifExpr.getChildAt(0)) === decl.name) {
			// 			errorHandled = true;
			// 		}
			// 	} else if(ifExpr.getChildAt(2).kind === ts.SyntaxKind.Identifier) {
			// 		if((<ts.Identifier>ifExpr.getChildAt(2)) === decl.name) {
			// 			errorHandled = true;
			// 		}
			// 	}

			// 	if(ifExpr.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) {
			// 		if(ifStatement.elseStatement === undefined) {
			// 			reportError(ifStatement, "Else block is missing");
			// 		}
			// 	} else if(ifExpr.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken) {
			// 		if(ifStatement.thenStatement === undefined) {
			// 			reportError(ifStatement, "Then block is missing");
			// 		}
			// 	}
			// }
		});

		if(errorHandled === false) {
			reportError(node, "Error not handled");
		}
	}

	function processChildNodes(root: ts.Node, processFn: (node: ts.Node) => void) {
		ts.forEachChild(root, child => {
			processFn(child);
			processChildNodes(child, processFn);
		});
	}

	function reportError(node: ts.Node, msg: string): void {
		let {line, character} = sourceFile.getLineAndCharacterOfPosition(node.getStart());
		console.log(`${sourceFile.fileName} (${line + 1}, ${character + 1}): ${msg}`);
	}
}

function run(strArgs: Array<string>) {
	let argv = <cmdOptions>args(strArgs,{"boolean": true});
	if (argv._.length === 0) {
		let usage =`
Usage: tsvet [options] <filenames>
options:
 --watch: run tsvet on file change
`;
		console.log(usage);
		process.exit(1);
	}

	if(argv.watch === true) {
		watch(argv._, {
			noEmitOnError: true,
			noImplicitAny: true,
			target: ts.ScriptTarget.ES5,
			module: ts.ModuleKind.CommonJS
		});
	} else {
		compileOnce(argv._, {
			noEmitOnError: true,
			noImplicitAny: true,
			target: ts.ScriptTarget.ES5,
			module: ts.ModuleKind.CommonJS
		});
	}
}

run(process.argv.slice(2));
