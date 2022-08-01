class SuperAnalyzer {
	code = '';

	codeGenerator = null;

	check() {}

	constructor(code, compiler) {
		this.code = code;

		this.compiler = compiler;
	}
}

class VariableDefinitionSuperAnalyzer extends SuperAnalyzer {
	name = null;

	equalSign = null;

	value = [];

	codeGenerator = VariableDefinitionCodeGenerator;

	check() {
		this.name = Object.seal(new IdentifierAnalyzer(this.code, this).check());

		this.equalSign = Object.seal(new EqualSignAnalyzer(this.code, this).check());

		if (this.equalSign === null) {
			return false;
		}

		// #a =
		if (this.name === null) {
			throw 'empty or invalid variable name';
		}

		this.name = this.name[1];

		var expectedAnalyzers = [NumberAnalyzer, PlusAnalyzer, MinusAnalyzer, IdentifierAnalyzer];

		var lastToken = false;

		// a = 5
		loop: do {
			for (var analyzer of this.compiler.analyzers) {
				var analyzerObject = Object.seal(new analyzer(this.code, this));

				if (analyzerObject.check(true) !== null) {
					// console.log(analyzerObject);
					
					// global analyzers can't be used in-line
					if (analyzerObject.global === true) {
						continue;
					}

					// semicolon used as an expression divider
					if (analyzer === SemicolonAnalyzer) {
						analyzerObject.cleanCode();

						break loop;
					}

					if (expectedAnalyzers.indexOf(analyzer) === -1) {
						console.log(analyzerObject);

						throw `not expected: ${analyzerObject.validationName}`;
					}

					console.log(analyzerObject);

					if (lastToken !== false) {
						if ([IdentifierAnalyzer, NumberAnalyzer].indexOf(analyzer) > -1) {
							if ([PlusAnalyzer, MinusAnalyzer].indexOf(lastToken) === -1) {
								// analyzerObject.resultHandler();

								throw 'operator missing before:\n\n' + this.code;
							}
						}
					}

					if (analyzer === lastToken) {
						throw 'sequence of same tokens not allowed';
					}

					analyzerObject.cleanCode();

					// TODO: deprecated?
					// analyzerObject.resultHandler();

					analyzerObject.validate();

					this.value.push(analyzerObject);

					lastToken = analyzer;

					continue loop;
				}
			}

			alert('бац');

			break;
		} while (this.code.length > 0);

		// var a = 
		if (lastToken === false) {
			throw 'no token found';
		}

		// var a = 5 +
		if ([PlusAnalyzer].indexOf(this.value.slice(-1)[0].constructor) !== -1) {
			throw 'last operator not followed by operand';
		}

		return true;
	}
}

class FunctionDefinitionSuperAnalyzer extends SuperAnalyzer {
	name = '';

	content = '';

	codeGenerator = FunctionDefinitionCodeGenerator;

	check() {
		var allFuncStart = Object.seal(new FunctionStartAnalyzer(this.code, this)).check();

		var allFuncEnd = Object.seal(new FunctionEndAnalyzer(this.code, this)).check();

		var sum = 0;

		if (allFuncStart !== null) {
			sum += allFuncStart.length;
		}

		if (allFuncEnd !== null) {
			sum += allFuncEnd.length;
		}

		if (sum === 0) {
			return false;
		}

		if (allFuncStart.length !== allFuncEnd.length) {
			throw 'function start and end number mismatch';
		}

		this.name = allFuncStart[0][1];

		var bodyStart = allFuncStart[0][0].length;

		for (var currentFuncEnd of allFuncEnd) {
			var funcStartNumber = 0;

			var funcEndNumber = 0;

			for (var funcStart of allFuncStart) {
				if (funcStart.index < currentFuncEnd.index) {
					funcStartNumber++;
				}
			}

			for (var funcEnd of allFuncEnd) {
				if (funcEnd.index <= currentFuncEnd.index) {
					funcEndNumber++;
				}
			}

			if (funcStartNumber === funcEndNumber) {
				this.content = this.code.substring(bodyStart, currentFuncEnd.index);

				this.code = this.code.substr(currentFuncEnd.index + currentFuncEnd[0].length);

				break;
			}
		}

		if (this.compiler.functionExists(this.name) === true) {
			throw `function "${this.name}" already exists`;
		}

		this.compiler.addFunction(new CompilerFunction(this.name));

		return true;
	}
}

class FunctionCallSuperAnalyzer extends SuperAnalyzer {
	function = '';

	arguments = '';

	codeGenerator = FunctionCallCodeGenerator;

	check() {
		var call = Object.seal(new FunctionCallAnalyzer(this.code, this)).check();

		if (call === null) {
			return false;
		}

		var name = call[1];

		if (this.compiler.functionExists(name) === false) {
			throw `function "${name}" not found`;
		}

		this.function = this.compiler.functions[name];

		this.arguments = call[2];

		return true;
	}
}

class IfDefinitionSuperAnalyzer extends SuperAnalyzer {
	condition = '';

	firstOperand = null;

	operator = null;

	secondOperand = null;

	content = '';

	codeGenerator = IfDefinitionCodeGenerator;

	checkOperand() {
		var operand = Object.seal(new IdentifierAnalyzer(this.condition, this));

		if (operand.check(true) !== null) {
			this.condition = operand.cleanCode(true);

			// TODO

			// var [variableExists, _] = this.compiler.checkVariable(operand.result[1]);

			// if (variableExists === false) {
			// 	throw 'variable ' + operand.result[1] + ' not found';
			// }

			return operand;
		}

		operand = Object.seal(new NumberAnalyzer(this.condition, this));

		if (operand.check(true) !== null) {
			this.condition = operand.cleanCode(true);

			operand.validate();

			return operand;
		}

		throw 'expected identifier or number in if condition';
	}

	check() {
		var allIfStart = Object.seal(new IfStartAnalyzer(this.code, this)).check();

		var allIfEnd = Object.seal(new IfEndAnalyzer(this.code, this)).check();

		var sum = 0;

		if (allIfStart !== null) {
			sum += allIfStart.length;
		}

		if (allIfEnd !== null) {
			sum += allIfEnd.length;
		}

		if (sum === 0) {
			return false;
		}

		if (allIfStart.length !== allIfEnd.length) {
			throw 'if statement start and end number mismatch';
		}

		this.condition = allIfStart[0][1];

		this.firstOperand = this.checkOperand();

		this.operator = Object.seal(new ConditionOperatorAnalyzer(this.condition, this));

		if (this.operator.check(true) === null) {
			throw 'condition operator missing';
		}

		this.condition = this.operator.cleanCode(true);

		this.operator = this.operator.result[1];

		this.secondOperand = this.checkOperand();

		if (this.condition !== '') {
			throw `not expected: ${this.condition}`;
		}

		// console.log(this.firstOperand, this.operator, this.secondOperand);

		var bodyStart = allIfStart[0][0].length;

		for (var currentIfEnd of allIfEnd) {
			var ifStartNumber = 0;

			var ifEndNumber = 0;

			for (var funcStart of allIfStart) {
				if (funcStart.index < currentIfEnd.index) {
					ifStartNumber++;
				}
			}

			for (var funcEnd of allIfEnd) {
				if (funcEnd.index <= currentIfEnd.index) {
					ifEndNumber++;
				}
			}

			if (ifStartNumber === ifEndNumber) {
				this.content = this.code.substring(bodyStart, currentIfEnd.index);

				this.code = this.code.substr(currentIfEnd.index + currentIfEnd[0].length);

				break;
			}
		}

		return true;
	}
}

class LabelSuperAnalyzer extends SuperAnalyzer {
	labelName = '';

	codeGenerator = LabelCodeGenerator;

	check() {
		var label = Object.seal(new LabelAnalyzer(this.code, this)).check();

		if (label === null) {
			return false;
		}

		this.labelName = label[1];

		return true;
	}
}

class GotoSuperAnalyzer extends SuperAnalyzer {
	labelName = '';

	codeGenerator = GotoCodeGenerator;

	check() {
		var goto = Object.seal(new GotoAnalyzer(this.code, this)).check();

		if (goto === null) {
			return false;
		}

		this.labelName = goto[1];

		return true;
	}
}