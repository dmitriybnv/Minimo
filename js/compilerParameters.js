class Compiler extends BaseCompiler {
    // TODO: deprecated?
    analyzers = [
        FunctionCallAnalyzer,
        FunctionStartAnalyzer,
        FunctionEndAnalyzer,
        IdentifierAnalyzer,
        EqualSignAnalyzer,
        NumberAnalyzer,
        PlusAnalyzer,
        MinusAnalyzer,
        SemicolonAnalyzer,
    ];

    superAnalyzers = [
        VariableDefinitionSuperAnalyzer,
        FunctionCallSuperAnalyzer,
        LabelSuperAnalyzer,
        GotoSuperAnalyzer,
        FunctionDefinitionSuperAnalyzer,
        IfDefinitionSuperAnalyzer,
    ];

    functions = {
        RAMSelect: new RAMSelect(),
        RAMRead: new RAMRead(),
        RAMWrite: new RAMWrite(),
        GPUSelect: new GPUSelect(),
        GPUAdd: new GPUAdd(),
        GPUSubtract: new GPUSubtract(),
        keyboardRead: new keyboardRead(),
        keyboardClear: new keyboardClear(),
        shiftLeft: new shiftLeft(),
        shiftRight: new shiftRight(),
    };
}