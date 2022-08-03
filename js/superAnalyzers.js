class SuperAnalyzer {
	code = '';

	codeGenerator = null;

	check() {}

	getContentAndCode(allOpeningTags, allClosingTags, name) {
		let sum = 0;

		if (allOpeningTags !== null) {
			sum += allOpeningTags.length;
		}

		if (allClosingTags !== null) {
			sum += allClosingTags.length;
		}

		if (sum === 0) {
			return false;
		}

		if (sum % 2 !== 0) {
			throw `"${name}" start and end statement number mismatch`;
		}

		let bodyStart = allOpeningTags[0][0].length;

		for (let currentClosingTag of allClosingTags) {
			let openingTagNumber = 0;

			let closingTagNumber = 0;

			for (let openingTag of allOpeningTags) {
				if (openingTag.index < currentClosingTag.index) {
					openingTagNumber++;
				}
			}

			for (let closingTag of allClosingTags) {
				if (closingTag.index <= currentClosingTag.index) {
					closingTagNumber++;
				}
			}

			if (openingTagNumber === closingTagNumber) {
				this.content = this.code.substring(bodyStart, currentClosingTag.index);

				this.code = this.code.substr(currentClosingTag.index + currentClosingTag[0].length);

				break;
			}
		}
	}

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

		let expectedAnalyzers = [NumberAnalyzer, PlusAnalyzer, MinusAnalyzer, IdentifierAnalyzer];

		/**
		 * @type {boolean|*}
		 */
		let lastToken = false;

		// a = 5
		loop: do {
			for (let analyzer of this.compiler.analyzers) {
				let analyzerObject = Object.seal(new analyzer(this.code, this));

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
		let allFuncStart = Object.seal(new FunctionStartAnalyzer(this.code, this)).check();

		let allFuncEnd = Object.seal(new FunctionEndAnalyzer(this.code, this)).check();

		if (this.getContentAndCode(allFuncStart, allFuncEnd, 'function') === false) {
			return false;
		}

		this.name = allFuncStart[0][1];

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
		let call = Object.seal(new FunctionCallAnalyzer(this.code, this)).check();

		if (call === null) {
			return false;
		}

		let name = call[1];

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
		let operand = Object.seal(new IdentifierAnalyzer(this.condition, this));

		if (operand.check(true) !== null) {
			this.condition = operand.cleanCode(true);

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
		let allIfStart = Object.seal(new IfStartAnalyzer(this.code, this)).check();

		let allIfEnd = Object.seal(new IfEndAnalyzer(this.code, this)).check();

		if (this.getContentAndCode(allIfStart, allIfEnd, 'if') === false) {
			return false;
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

		return true;
	}
}

class LabelSuperAnalyzer extends SuperAnalyzer {
	labelName = '';

	codeGenerator = LabelCodeGenerator;

	check() {
		let label = Object.seal(new LabelAnalyzer(this.code, this)).check();

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
		let goto = Object.seal(new GotoAnalyzer(this.code, this)).check();

		if (goto === null) {
			return false;
		}

		this.labelName = goto[1];

		return true;
	}
}