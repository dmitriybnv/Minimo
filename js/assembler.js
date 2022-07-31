function OpcodeType(code, operands) {
	this.code = code;

	this.operands = operands;
}

function OperandType(pattern, getCode, alwaysEmpty) {
	this.pattern = pattern;

	this.getCode = getCode;

	this.alwaysEmpty = alwaysEmpty;
}

function Label(pointsTo) {
	this.pointsTo = pointsTo;
}

function LabelRequest(name, requestedAt) {
	this.name = name;

	this.requestedAt = requestedAt;
}

function Assembler(string, instructionLength) {
	this.string = string;

	this.instructionLength = instructionLength;

	this.bytes = [];

	this.labels = {};

	this.labelRequests = [];

	this.assemble();
}

Assembler.prototype.opcodeTypes = {};

Assembler.prototype.operandTypes = {};

Assembler.prototype.beautifyBytes = function() {
	var temp = [];

	this.bytes.forEach(v => {temp.push(parseInt(v, 2).toString(16).padStart(4, '0'))});

	return temp.join(' ');
}

Assembler.prototype.showInfo = function() {
	if (this.string !== '') {
		console.log(this.string);
	}

	console.log(this.beautifyBytes(this.bytes));
}

Assembler.prototype.cleanCode = function() {
	this.string = this.string.replace(/;.*/g, '') // removing comments
	
	.replace(/\s/g, ''); // removing whitespaces
};

Assembler.prototype.assemble = function() {
	this.cleanCode();

	do {
		var opcodeFound = false;

		var result = this.string.match(/^#([_a-z0-9]+)#/i);

		if (result !== null) {
			console.log('label: ' + result[1]);

			this.labels[result[1]] = new Label(this.bytes.length);

			this.string = this.string.substr(result[0].length);

			continue;
		}

		for (var opcode in this.opcodeTypes) {
			// result = this.string.search(new RegExp('^' + opcode));
			result = this.string.search(new RegExp(String.raw`^${opcode}`, 'i'));

			var code = '';

			if (result !== -1) {
				console.log('opcode: ' + opcode);

				this.string = this.string.substr(opcode.length);

				code += this.opcodeTypes[opcode].code;

				opcodeFound = true;

				var operands = this.opcodeTypes[opcode].operands;

				for (var operand in operands) {
					operand = operands[operand];

					var type = this.operandTypes[operand];

					result = this.string.match(type.pattern);

					if (result !== null) {
						console.log('\toperand: ' + operand);

						code += type.getCode(result, this);

						if (!type.alwaysEmpty) {
							this.string = this.string.substr(result[0].length);
						}
					} else {
						this.showInfo();

						throw 'no operand found';
					}
				}

				this.bytes.push(code);

				console.log(code);

				break;
			}
		}

		if (!opcodeFound) {
			this.showInfo();

			throw 'no opcode found';
		}
	} while (this.string.length > 0);

	for (var request in this.labelRequests) {
		request = this.labelRequests[request];

		if (this.labels[request.name] !== undefined) {
			var position = this.labels[request.name].pointsTo;

			var labelLink = position.toString(2);

			this.bytes[request.requestedAt] += labelLink.padStart(11, '0');

			console.log(this.bytes[request.requestedAt]);
		} else {
			throw 'label ' + request.name + ' used but not found';
		}
	}

	for (var byte in this.bytes) {
		this.bytes[byte] = this.bytes[byte].padEnd(this.instructionLength, '0');
	}
};