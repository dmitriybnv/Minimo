class CodeGenerator {
	superAnalyzer = null;

	generateCode() {}

	constructor(superAnalyzer) {
		this.superAnalyzer = superAnalyzer;
	}
}

class VariableDefinitionCodeGenerator extends CodeGenerator {
	generateCode() {
		let compiler = this.superAnalyzer.compiler;

		let analyzers = this.superAnalyzer.value;

		let pendingOperation = null;

		let assemblyCode = 'LD ACC 00; cleaning' + '\n\n';

		for (let i = 0; i < analyzers.length; i++) {
			let analyzer = analyzers[i];

			if (analyzer.constructor === NumberAnalyzer) {
				let accumulator = parseInt(analyzer.result[1]);

				if (analyzers[i + 1] !== undefined) {
					for (let k = i + 1; k < analyzers.length;) {
						if (analyzers[k].constructor === PlusAnalyzer) {
							if (analyzers[k + 1].constructor === NumberAnalyzer) {
								accumulator += analyzers[k + 1].result[1];

								k += 2;

								i = k - 1;

								continue;
							}
						}

						if (analyzers[k].constructor === MinusAnalyzer) {
							if (analyzers[k + 1].constructor === NumberAnalyzer) {
								accumulator -= analyzers[k + 1].result[1];

								k += 2;

								i = k - 1;

								continue;
							}
						}

						break;
					}
				}

				let operation = 'ADD';

				if (pendingOperation === MinusAnalyzer) {
					operation = 'SUB';
				}

				assemblyCode += `LD R1 ${this.superAnalyzer.compiler.decimalToHex(accumulator)}` + '\n'
							+ `${operation} R1` + '\n\n';

				continue;
			}

			if (analyzer.constructor === PlusAnalyzer) {
				pendingOperation = PlusAnalyzer;

				continue;
			}

			if (analyzer.constructor === MinusAnalyzer) {
				pendingOperation = MinusAnalyzer;

				continue;
			}

			if (analyzer.constructor === IdentifierAnalyzer) {
				let variableId = compiler.checkVariable(analyzer.result[1]);

				let address = this.superAnalyzer.compiler.decimalToHex(variableId);

				if (pendingOperation === null) {
					pendingOperation = PlusAnalyzer;
				}

				if (pendingOperation === PlusAnalyzer) {
					assemblyCode += `LD R0 ${address}` + '\n'
								+ 'MAR R0' + '\n'
								+ 'MR R1' + '\n'
								+ 'ADD R1' + '\n\n';

					pendingOperation = null;
				}

				continue;
			}

			break;
		}

		let variableId = compiler.checkVariable(this.superAnalyzer.name, true);

		/**
		 * @type {string}
		 */
		let address;

		if (variableId === null) {
			compiler.variables.push(new CompilerVariable(
				'',
				this.superAnalyzer.name,
			));

			address = this.superAnalyzer.compiler.decimalToHex(compiler.variables.length - 1);
		} else {
			address = this.superAnalyzer.compiler.decimalToHex(variableId);
		}

		assemblyCode += `LD R0 ${address}; "${this.superAnalyzer.name}"` + '\n'
					+ 'MAR R0' + '\n'
					+ 'MW ACC' + '\n\n';
		
		return assemblyCode;
	}
}

class FunctionDefinitionCodeGenerator extends CodeGenerator {
	generateCode(originalFlag) {
		let compiler = this.superAnalyzer.compiler;

		let content = this.superAnalyzer.content;

		let compiledContent = compiler.compile(content, true);

		let code = `#${this.superAnalyzer.name}#` + '\n\n'
			+ compiledContent
			+ 'RET' + '\n\n';

		if (originalFlag === true) {
			compiler.functionAssemblyCode += code;

			return false;
		}

		return code;
	}
}

class FunctionCallCodeGenerator extends CodeGenerator {
	generateCode() {
		let _function = this.superAnalyzer.function;

		let name = _function.name;

		/**
		 * @type {string}
		 */
		let code;

		if (_function.systemFunction === true) {
			code = _function.execute(this.superAnalyzer.compiler, this.superAnalyzer.arguments);
		} else {
			code = `CAL ${name}$ ; execute "${name}"` + '\n\n';
		}

		return code;
	}
}

class IfDefinitionCodeGenerator extends CodeGenerator {
	code = '';

	generateOperandCode(operand, number) {
		let compiler = this.superAnalyzer.compiler;

		if (operand.constructor === NumberAnalyzer) {
			let accumulator = 'R0';

			if (number < 1) {
				accumulator = 'ACC';
			}

			this.code += `LD ${accumulator} ${compiler.decimalToHex(parseInt(operand.result[1]))}` + '\n';
		} else {
			if (operand.constructor === IdentifierAnalyzer) {
				let accumulator = 'R0';

				if (number < 1) {
					accumulator = 'ACC';
				}

				let variableId = compiler.checkVariable(operand.result[1]);

				this.code += `LD R0 ${compiler.decimalToHex(variableId)}` + '\n'
						+ 'MAR R0' + '\n'
						+ `MR ${accumulator}` + '\n';
			}
		}
	}

	generateCode() {
		let compiler = this.superAnalyzer.compiler;

		let content = this.superAnalyzer.content;

		let compiledContent = compiler.compile(content, true);

		let jumpType = '';

		switch (this.superAnalyzer.operator) {
			case '>':
				jumpType = 'JG';

				break;
			case '<': 
				jumpType = 'JL';

				break;
			case '==':
				jumpType = 'JE';

				break;
		}

		let label = compiler.getRandomLabel();

		this.generateOperandCode(this.superAnalyzer.firstOperand, 0);

		this.generateOperandCode(this.superAnalyzer.secondOperand, 1);

		this.code +=  'CMP R0' + '\n\n'
				+ `${jumpType} if_${label}_success$` + '\n'
				+ `JMP if_${label}_fail$` + '\n\n'
				+ `#if_${label}_success#` + '\n\n'
				+ `${compiledContent}`
				+ `#if_${label}_fail#` + '\n\n';

		return this.code;
	}
}

class LabelCodeGenerator extends CodeGenerator {
	generateCode() {
		let compiler = this.superAnalyzer.compiler;

		let labelName = this.superAnalyzer.labelName;

		if (compiler.checkIfLabelExists(labelName) === true) {
			throw `label "${labelName}" already in use`;
		}

		compiler.reservedLabels.push(labelName);

		return `#${labelName}#\n\n`;
	}
}

class GotoCodeGenerator extends CodeGenerator {
	generateCode() {
		let labelName = this.superAnalyzer.labelName;

		// if (compiler.checkIfLabelExists(labelName) === false) {
		// 	throw `label "${labelName}" not in use`;
		// }

		return `JMP ${labelName}$\n\n`;
	}
}