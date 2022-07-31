class CompilerVariable {
	type = '';

	name = '';

	constructor(type, name) {
		this.type = type;

		this.name = name;
	}
}

class CompilerFunction {
	name = '';

	systemFunction = false;

	argumentNumber = 0;

	handler(compiler, _arguments) {}

	execute(compiler, argumentString) {
		var _arguments = [];

		while (_arguments.length < this.argumentNumber) {
			var identifier = new IdentifierAnalyzer(argumentString);

			var result = identifier.check();

			if (result === null) {
				throw `no argument found for "${this.name}" function`;
			}

			var [variableExists, variableId] = compiler.checkVariable(identifier.result[1]);

			if (variableExists === false) {
				throw `variable "${identifier.result[1]}" not defined`;
			}

			_arguments.push(variableId);

			argumentString = identifier.code;
		}

		if (argumentString.length > 0) {
			throw `only ${this.argumentNumber} argument(s) expected for `
				+ `"${this.name}" function` + '\n\n'
				+ `expression "${argumentString}" not needed` + '\n\n';
		}

		return this.handler(compiler, _arguments);
	}

	constructor(name) {
		if (name !== undefined) {
			this.name = name;
		}
	}
}

class Compiler {
	inputCode = '';

	assemblyCode = '';

	functionAssemblyCode = '';

	variables = [];

	analyzers = [];

	functions = {};

	reservedLabels = [
		'____MAIN_START____',
	];

	counter = -1;

	superAnalyzers = [];

	checkIfLabelExists(name) {
		for (var label of this.reservedLabels) {
			if (name === label) {
				return true;
			}
		}

		return false;
	}

	getRandomLabel() {
		var randomString = (this.counter + 1).toString();

		if (this.checkIfLabelExists(randomString) === true) {
			return getRandomLabel();
		}

		this.counter++;

		this.reservedLabels.push(randomString);

		return randomString;
	}

	decimalToHex(decimal) {
		return decimal.toString(16).padStart(2, 0).toUpperCase();
	}

	addFunction(_function) {
		this.functions[_function.name] = _function;
	}

	functionExists(name) {
		return this.functions[name] !== undefined;
	}

	checkVariable(name) {
		for (var i = 0; i < this.variables.length; i++) {
			var variable = this.variables[i];

			if (variable.name === name) {
				return [true, i];
			}
		}

		// TODO: throw 'variable ' + operand.result[1] + ' not found';

		return [false, null];
	}

	logBefore(superAnalyzer) {
		console.group(superAnalyzer.name);
	}

	logAfter(superAnalyzer, result) {
		if (result === true) {
			console.log('%c matching', 'color: chartreuse');
		} else {
			console.log('%c not matching', 'color: lightcoral');
		}

		console.groupEnd(superAnalyzer.name);
	}

	finalTouch() {
		this.assemblyCode = 'JMP ____MAIN_START____$' + '\n\n'
					+ this.functionAssemblyCode
					+ '#____MAIN_START____#' + '\n\n'
					+ this.assemblyCode
					+ 'HALT';
	}

	compile(inputCode, returnFlag)  {
		if (inputCode === '') {
			throw 'code is empty';
		}

		var assemblyCode = '';

		do {
			var superAnalyzerFound = false;

			for (var superAnalyzer of this.superAnalyzers) {
				var superAnalyzerObject = Object.seal(new superAnalyzer(inputCode, this));

				this.logBefore(superAnalyzer);

				console.log(JSON.stringify(inputCode));

				try {
					var result = superAnalyzerObject.check();
				} finally {
					this.logAfter(superAnalyzer, result);
				}

				if (result === false) {
					continue;
				}

				superAnalyzerFound = true;
				
				var codeGenerator = Object.seal(new superAnalyzerObject.codeGenerator(superAnalyzerObject));

				var generatedCode = codeGenerator.generateCode(!returnFlag);

				if (generatedCode !== false) {
					assemblyCode += generatedCode;
				}

				inputCode = superAnalyzerObject.code;

				break;
			}

			if (superAnalyzerFound === false) {
				console.log(inputCode);

				throw 'unknown expression: \n\n' + inputCode;
			}
		} while (inputCode.length > 0);

		if (returnFlag === true) {
			return assemblyCode;
		}

		this.assemblyCode += assemblyCode;

		this.finalTouch();
	}
}