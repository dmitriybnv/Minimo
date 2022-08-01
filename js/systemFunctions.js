class RAMSelect extends CompilerFunction {
	name = 'RAMSelect';

	systemFunction = true;

	argumentNumber = 1;

	handler(compiler, _arguments) {
		let assemblyCode = '';

		assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
					+ 'MAR R0' + '\n'
					+ 'MR R0' + '\n'
					+ 'MAR R0' + '\n'
					+ 'CPY R0 R5 ; last MAR address' + '\n\n';

		return assemblyCode;
	}
}

class RAMWrite extends CompilerFunction {
	name = 'RAMWrite';

	systemFunction = true;

	argumentNumber = 1;

	handler(compiler, _arguments) {
		let assemblyCode = '';

		assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
					+ 'MAR R0' + '\n'
					+ 'MR R0' + '\n'
					+ 'MAR R5' + '\n'
					+ 'MW R0' + '\n\n';

		return assemblyCode;
	}
}

class RAMRead extends CompilerFunction {
	name = 'RAMRead';

	systemFunction = true;

	argumentNumber = 1;

	handler(compiler, _arguments) {
		let assemblyCode = '';

		assemblyCode += 'MR R1' + '\n'
					+ `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
					+ 'MAR R0' + '\n'
					+ 'MW R1' + '\n\n';

		// TODO:
		// assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
		// 			+ 'MR R0' + '\n\n';

		return assemblyCode;
	}
}

class GPUSelect extends CompilerFunction {
	name = 'GPUSelect';

	systemFunction = true;

	argumentNumber = 1;

	handler(compiler, _arguments) {
		let assemblyCode = '';

		assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
					+ 'MAR R0' + '\n'
					+ 'MR R0' + '\n'
					+ 'GSEL R0' + '\n\n';

		return assemblyCode;
	}
}

class GPUAdd extends CompilerFunction {
	name = 'GPUAdd';

	systemFunction = true;

	argumentNumber = 1;

	handler(compiler, _arguments) {
		let assemblyCode = '';

		assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
					+ 'MAR R0' + '\n'
					+ 'MR R0' + '\n'
					+ 'GADD R0' + '\n\n';

		return assemblyCode;
	}
}

class GPUSubtract extends CompilerFunction {
	name = 'GPUSubtract';

	systemFunction = true;

	argumentNumber = 1;

	handler(compiler, _arguments) {
		let assemblyCode = '';

		assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
					+ 'MAR R0' + '\n'
					+ 'MR R0' + '\n'
					+ 'GSUB R0' + '\n\n';

		return assemblyCode;
	}
}

class keyboardRead extends CompilerFunction {
	name = 'keyboardRead';

	systemFunction = true;

	argumentNumber = 1;

	handler(compiler, _arguments) {
		let assemblyCode = '';

		assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
					+ 'MAR R0' + '\n'
					+ 'KEY R0' + '\n'
					+ 'MW R0' + '\n\n';

		return assemblyCode;
	}
}

class keyboardClear extends CompilerFunction {
	name = 'keyboardClear';

	systemFunction = true;

	argumentNumber = 0;

	handler(compiler) {
		// assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
		// 			+ 'MAR R0' + '\n'
		// 			+ 'KEY R0' + '\n'
		// 			+ 'MW R0' + '\n\n';

		return 'KCL' + '\n\n';
	}
}

class shiftLeft extends CompilerFunction {
	name = 'shiftLeft';

	systemFunction = true;

	argumentNumber = 1;

	handler(compiler, _arguments) {
		let assemblyCode = '';

		assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
					+ 'MAR R0' + '\n'
					+ 'MR ACC' + '\n'
					+ 'SL' + '\n'
					+ 'MW ACC' + '\n\n';

		return assemblyCode;
	}
}

class shiftRight extends CompilerFunction {
	name = 'shiftRight';

	systemFunction = true;

	argumentNumber = 1;

	handler(compiler, _arguments) {
		let assemblyCode = '';

		assemblyCode += `LD R0 ${compiler.decimalToHex(_arguments[0])}` + '\n'
					+ 'MAR R0' + '\n'
					+ 'MR ACC' + '\n'
					+ 'SR' + '\n'
					+ 'MW ACC' + '\n\n';

		return assemblyCode;
	}
}