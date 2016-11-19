interface VariableGeneratorFunction {
	(): string;
}

export const VariableGenerators: {[variableName: string]: VariableGeneratorFunction} = {
	'now': currentDate,
	'Date.now': currentDate
};

function currentDate() {
	return (new Date()).toISOString();
}