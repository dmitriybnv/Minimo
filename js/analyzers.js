class Analyzer {
	code = '';

	regexp = new RegExp('');

	result = null;

	validationName = '';

	superAnalyzer = null;

	global = false;

	validate() {}

	cleanCode(returnCode) {
		if (this.result === null) {
			return;
		}

		let updatedCode = this.code.substr(this.result[0].length);

		if (returnCode === true) {
			return updatedCode;
		} else {
			if (this.superAnalyzer === null) {
				this.code = updatedCode;
			} else {
				this.superAnalyzer.code = updatedCode;
			}
		}
	}

	check(disableAutoFeatures) {
		if (this.global === true) {
			this.result = Array.from(this.code.matchAll(this.regexp));

			if (this.result.length === 0) {
				// this.validate();

				return null;
			}

			return this.result;
		}

		this.result = this.code.match(this.regexp);

		if (disableAutoFeatures !== undefined) {
			return this.result;
		}

		if (this.result === null) {
			return this.result;
		}

		this.validate();
		
		this.cleanCode();

		return this.result;
	}

	constructor(code, superAnalyzer) {
		this.code = code;

		if (superAnalyzer !== undefined) {
			this.superAnalyzer = superAnalyzer;
		}
	}
}

const IdentifierPattern = String.raw`[_a-z][\w]*`;

class IdentifierAnalyzer extends Analyzer {
	regexp = new RegExp(String.raw`^\s*(${IdentifierPattern})\s*`, 'i');

	validationName = 'identifier';
}

class NumberAnalyzer extends Analyzer {
	regexp = /^\s*(\d+)\s*/;

	validationName = 'number';

	validate() {
		if (this.result[1] > 255) {
			throw 'number greater than 255';
		}
	}
}

class EqualSignAnalyzer extends Analyzer {
	regexp = /^\s*=\s*/;

	validationName = 'equal sign';
}

class PlusAnalyzer extends Analyzer {
	regexp = /^\s*\+\s*/;

	validationName = 'plus';
}

class MinusAnalyzer extends Analyzer {
	regexp = /^\s*-\s*/;

	validationName = 'minus';
}

class SemicolonAnalyzer extends Analyzer {
	regexp = /^\s*;+\s*/;

	validationName = 'semicolon';
}

const FunctionNamePattern = IdentifierPattern;

class FunctionStartAnalyzer extends Analyzer {
	regexp = new RegExp(String.raw`\s*\bfunc\b\s+(?!endfunc)(?!func)(${FunctionNamePattern})`, 'gi');

	validationName = 'function start';

	global = true;
}

class FunctionEndAnalyzer extends Analyzer {
	regexp = /\bendfunc\b\s*/g;

	validationName = 'function end';

	global = true;
}

class FunctionCallAnalyzer extends Analyzer {
	regexp = new RegExp(String.raw`^\s*(${FunctionNamePattern})*\(([^)]*)\)\s*|^(.+)\([^)]\)`, 'i');

	validationName = 'function call';

	validate() {
		if (this.result[3] !== undefined) {
			throw `wrong function name "${this.result[3]}"`;
		}

		if (this.result[1] === undefined) {
			throw 'function name empty';
		}
	}
}

class IfStartAnalyzer extends Analyzer {
	regexp = /\s*if\s*\(([^)]*)\)/gi;

	validationName = 'if start';

	global = true;
}

class IfEndAnalyzer extends Analyzer {
	regexp = /\bendif\b\s*/g;

	validationName = 'if end';

	global = true;
}

class ConditionOperatorAnalyzer extends Analyzer {
	regexp = /^\s*(==|<|>)\s*/;

	validationName = 'condition operator';
}

const LabelPattern = IdentifierPattern;

class LabelAnalyzer extends Analyzer {
	regexp = new RegExp(String.raw`^\s*#(${LabelPattern})#\s*`, 'i');

	validationName = 'label';
}

class GotoAnalyzer extends Analyzer {
	regexp = new RegExp(String.raw`^\s*goto (${LabelPattern})*\$\s*`, 'i');

	validationName = 'goto';

	validate() {
		if (this.result[1] === undefined) {
			throw 'goto label missing';
		}
	}
}