class CodeGenerator {
	superAnalyzer = null;

	generateCode() {}

	constructor(superAnalyzer) {
		this.superAnalyzer = superAnalyzer;
	}
}

class VariableDefinitionCodeGenerator extends CodeGenerator {
	generateCode() {
		var compiler = this.superAnalyzer.compiler;

		var analyzers = this.superAnalyzer.value;

		var pendingOperation = null;

		var assemblyCode = 'LD ACC 00; cleaning' + '\n\n';

		for (var i = 0; i < analyzers.length; i++) {
			var analyzer = analyzers[i];

			if (analyzer.constructor === NumberAnalyzer) {
				var accumulator = parseInt(analyzer.result[1]);

				if (analyzers[i + 1] !== undefined) {
					for (var k = i + 1; k < analyzers.length;) {
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

				var operation = 'ADD';

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
				var [variableExists, variableId] = compiler.checkVariable(analyzer.result[1]);

				if (variableExists === false) {
					throw 'variable ' + analyzer.result[1] + ' not found';
				}

				var address = this.superAnalyzer.compiler.decimalToHex(variableId);

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

		var [variableExists, variableId] = compiler.checkVariable(this.superAnalyzer.name);

		var address = '';

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
		var compiler = this.superAnalyzer.compiler;

		var content = this.superAnalyzer.content;

		var compiledContent = compiler.compile(content, true);

		var code = `#${this.superAnalyzer.name}#` + '\n\n'
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
		var _function = this.superAnalyzer.function;

		var name = _function.name;

		var code = '';

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
		var compiler = this.superAnalyzer.compiler;

		if (operand.constructor === NumberAnalyzer) {
			var accumulator = 'R0';

			if (number < 1) {
				accumulator = 'ACC';
			}

			this.code += `LD ${accumulator} ${compiler.decimalToHex(parseInt(operand.result[1]))}` + '\n';
		} else {
			if (operand.constructor === IdentifierAnalyzer) {
				var accumulator = 'R0';

				if (number < 1) {
					accumulator = 'ACC';
				}

				var [variableExists, variableId] = compiler.checkVariable(operand.result[1]);

				if (variableExists === false) {
					throw 'variable ' + operand.result[1] + ' not found';
				}

				this.code += `LD R0 ${compiler.decimalToHex(variableId)}` + '\n'
						+ 'MAR R0' + '\n'
						+ `MR ${accumulator}` + '\n';
			}
		}
	}

	generateCode() {
		var compiler = this.superAnalyzer.compiler;

		var content = this.superAnalyzer.content;

		var compiledContent = compiler.compile(content, true);

		var jumpType = '';

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

		var label = compiler.getRandomLabel();

		this.generateOperandCode(this.superAnalyzer.firstOperand, 0);

		this.generateOperandCode(this.superAnalyzer.secondOperand, 1);

		this.code +=  'CMP R0' + '\n\n'
				+ `${jumpType} IF_${label}_SUCCESS$` + '\n'
				+ `JMP IF_${label}_FAIL$` + '\n\n'
				+ `#IF_${label}_SUCCESS#` + '\n\n'
				+ `${compiledContent}`
				+ `#IF_${label}_FAIL#` + '\n\n';

		return this.code;
	}
}

class LabelCodeGenerator extends CodeGenerator {
	generateCode() {
		var compiler = this.superAnalyzer.compiler;

		var labelName = this.superAnalyzer.labelName;

		if (compiler.checkIfLabelExists(labelName) === true) {
			throw `label "${labelName}" already in use`;
		}

		compiler.reservedLabels.push(labelName);

		return `#${labelName}#\n\n`;
	}
}

class GotoCodeGenerator extends CodeGenerator {
	generateCode() {
		var compiler = this.superAnalyzer.compiler;

		var labelName = this.superAnalyzer.labelName;

		// if (compiler.checkIfLabelExists(labelName) === false) {
		// 	throw `label "${labelName}" not in use`;
		// }

		return `JMP ${labelName}$\n\n`;
	}
}