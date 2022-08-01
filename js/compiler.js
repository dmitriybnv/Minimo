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
		let _arguments = [];

		while (_arguments.length < this.argumentNumber) {
			let identifier = new IdentifierAnalyzer(argumentString);

			let result = identifier.check();

			if (result === null) {
				throw `no argument found for "${this.name}" function`;
			}

			let [variableExists, variableId] = compiler.checkVariable(identifier.result[1]);

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
		for (let label of this.reservedLabels) {
			if (name === label) {
				return true;
			}
		}

		return false;
	}

	getRandomLabel() {
		let randomString = (this.counter + 1).toString();

		if (this.checkIfLabelExists(randomString) === true) {
			return this.getRandomLabel();
		}

		this.counter++;

		this.reservedLabels.push(randomString);

		return randomString;
	}

	/**
	 * @param {number} decimal
	 * @returns {string}
	 */
	decimalToHex(decimal) {
		return decimal.toString(16).padStart(2, '0').toUpperCase();
	}

	addFunction(_function) {
		this.functions[_function.name] = _function;
	}

	functionExists(name) {
		return this.functions[name] !== undefined;
	}

	checkVariable(name) {
		for (let i = 0; i < this.variables.length; i++) {
			let variable = this.variables[i];

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

		console.groupEnd();
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

		let assemblyCode = '';

		do {
			let superAnalyzerFound = false;

			for (let superAnalyzer of this.superAnalyzers) {
				let superAnalyzerObject = Object.seal(new superAnalyzer(inputCode, this));

				this.logBefore(superAnalyzer);

				console.log(JSON.stringify(inputCode));

				let result = false;

				try {
					result = superAnalyzerObject.check();
				} finally {
					this.logAfter(superAnalyzer, result);
				}

				if (result === false) {
					continue;
				}

				superAnalyzerFound = true;

				let codeGenerator = Object.seal(new superAnalyzerObject.codeGenerator(superAnalyzerObject));

				let generatedCode = codeGenerator.generateCode(!returnFlag);

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