interface VariableGeneratorFunction {
	(): string
}

interface VariableGeneratorsDictionary {
	[variableName: string]: VariableGeneratorFunction
}

export const VariableGenerators: VariableGeneratorsDictionary = {
	'now': () => (new Date()).toISOString(),
	'Date.now': () => (new Date()).toISOString()
}
