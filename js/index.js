'use strict'

let compilingError = false;

let displayAssemblyCode = false;

let compiler = null;

let generateButton = document.querySelector('#generateButton');

let assemblyButton = document.querySelector('#assemblyButton');

let textareaLeft = document.querySelector('textarea.left');

let textareaRight = document.querySelector('textarea.right');

generateButton.onclick = function() {
	try {
		compiler = Object.seal(new Compiler());

		// TODO: deprecated?
		compiler.analyzers = [
			FunctionCallAnalyzer,
			FunctionStartAnalyzer,
			FunctionEndAnalyzer,
			IdentifierAnalyzer,
			EqualSignAnalyzer,
			NumberAnalyzer,
			PlusAnalyzer,
			MinusAnalyzer,
			SemicolonAnalyzer,
		];

		compiler.superAnalyzers = [
			VariableDefinitionSuperAnalyzer,
			FunctionCallSuperAnalyzer,
			LabelSuperAnalyzer,
			GotoSuperAnalyzer,
			FunctionDefinitionSuperAnalyzer,
			IfDefinitionSuperAnalyzer,
		];

		compiler.functions = {
			RAMSelect: new RAMSelect(),
			RAMRead: new RAMRead(),
			RAMWrite: new RAMWrite(),
			GPUSelect: new GPUSelect(),
			GPUAdd: new GPUAdd(),
			GPUSubtract: new GPUSubtract(),
			keyboardRead: new keyboardRead(),
			keyboardClear: new keyboardClear(),
			shiftLeft: new shiftLeft(),
			shiftRight: new shiftRight(),
		};

		compiler.compile(textareaLeft.value, false);

		textareaRight.value = compiler.assemblyCode;

		compilingError = false;

		displayAssemblyCode = false;
	} catch (error) {
		console.error(error);

		textareaRight.value = error;

		compilingError = true;
	}
};

assemblyButton.onclick = function() {
	if (compiler === null || (compilingError === true)) {
		return;
	}

	if (displayAssemblyCode === false) {
		try {
			let assembler = Object.seal(new Assembler(compiler.assemblyCode, 16));

			textareaRight.value = assembler.beautifyBytes(assembler.bytes);
		} catch (error) {
			textareaRight.value = error;
		}
	} else {
		textareaRight.value = compiler.assemblyCode;
	}

	displayAssemblyCode = !displayAssemblyCode;
};

textareaRight.onclick = function() {
	this.focus();

	this.select();
};

textareaRight.value = '';