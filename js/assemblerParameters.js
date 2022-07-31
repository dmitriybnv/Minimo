Assembler.prototype.operandTypes = {
	// REGACC: new OperandType('R([0-5])|ACC', r => {
	REGACC: new OperandType(/^R([0-5])|ACC/i, r => {
		return (r[1] !== undefined) ? parseInt(r[1]).toString(2).padStart(3, '0') : '111';
	}),

	// HEX: new OperandType('([A-Z0-9]{2})', r => {
	HEX: new OperandType(/^([a-z0-9]{2})/i, r => {
		return parseInt(r[1], 16).toString(2).padStart(8, '0');
	}),

	// LABEL: new OperandType('([A-Z_0-9]+)\\$', function(result, context) {
	LABEL: new OperandType(/^([_a-z0-9]+)\$/i, function(result, context) {
		context.labelRequests.push(new LabelRequest(result[1], context.bytes.length));

		return '';
	}),
};

Assembler.prototype.opcodeTypes = {
	NOP: new OpcodeType('00000', []),
	HALT: new OpcodeType('10110', []),

	LD: new OpcodeType('00001', ['REGACC', 'HEX']),
	CPY: new OpcodeType('00010', ['REGACC', 'REGACC']),

	JMP: new OpcodeType('00011', ['LABEL']),
	CAL: new OpcodeType('00100', ['LABEL']),
	RET: new OpcodeType('00101', []),

	CMP: new OpcodeType('00110', ['REGACC']),
	ADD: new OpcodeType('00111', ['REGACC']),
	SUB: new OpcodeType('01000', ['REGACC']),
	SL: new OpcodeType('10001', []),
	SR: new OpcodeType('10010', []),

	JG: new OpcodeType('01001', ['LABEL']),
	JE: new OpcodeType('01010', ['LABEL']),
	JL: new OpcodeType('01011', ['LABEL']),

	GSEL: new OpcodeType('10000', ['REGACC']),
	GADD: new OpcodeType('01100', ['REGACC']),
	GSUB: new OpcodeType('10101', ['REGACC']),

	KEY: new OpcodeType('10011', ['REGACC']),
	KCL: new OpcodeType('10100', []),

	MAR: new OpcodeType('01101', ['REGACC']),
	MR: new OpcodeType('01110', ['REGACC']),
	MW: new OpcodeType('01111', ['REGACC']),
};