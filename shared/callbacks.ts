import { spawn } from 'child_process';
import * as opn from 'opn';

import { replaceVariables } from './pipes';
import { NotificationCallback } from './watchers';
import { WatcherConfigurationVariables } from '../configuration/interfaces';
import { log, inspect } from './logger';

interface CallbackGenerator {
	(parameters: string, event?: string): NotificationCallback;
}

interface CallbackGeneratorRule {
	rule: RegExp | string;
	terminal?: boolean;
	generator: CallbackGenerator;
}

const open = {
	rule: 'open',
	generator: (parameters: string, event: string = '') => (variables: WatcherConfigurationVariables) => {
		log(event.black.bgYellow.bold, 'Open'.yellow.bold, replaceVariables(parameters, variables).yellow);
		opn(replaceVariables(parameters, variables));
	}
};

const run = {
	rule: 'run',
	generator: (parameters: string, event: string = '') => (variables: WatcherConfigurationVariables) => {
		log(event.black.bgYellow.bold, 'Run'.yellow.bold, replaceVariables(parameters, variables).yellow);
		let runCommand = replaceVariables(parameters, variables).split(/\s+/);
		spawn(runCommand[0], [...runCommand.slice(1)], {shell: true});
	}
};

const debugTerminal = {
	rule: 'debug',
	terminal: true,
	generator: (parameters: string, event: string = '') => (variables: WatcherConfigurationVariables) => {
		log(event.black.bgYellow.bold, inspect(variables).blue);
	}
};

const debug = {
	rule: 'debug',
	generator: (parameters: string, event: string = '') => (variables: WatcherConfigurationVariables) => {
		let debugString = replaceVariables(parameters, variables);
		log(event.black.bgYellow.bold, debugString.blue);
	}
};

const CallbackGenerators: CallbackGeneratorRule[] = [
	open, run, debug, debugTerminal
];

function getGeneratorRuleRegExp({
	rule = /^$/,
	terminal = false
}: {rule?: string | RegExp, terminal?: boolean} = {}): RegExp {
	return (
		typeof rule === 'string' ?
		new RegExp(`^\\s*${rule}\\s${terminal ? '*$' : '+'}`, 'i') :
		<RegExp>rule
	);
}

function testGeneratorRule(functionString: string, generatorRule: CallbackGeneratorRule): boolean {
	return getGeneratorRuleRegExp(generatorRule).test(functionString);
}

function getGeneratorParameters(functionString: string, generatorRule: CallbackGeneratorRule): string {
	return functionString
		.replace(getGeneratorRuleRegExp(generatorRule), '')
		.replace(/\$(\d+)/gi, (match, num) => `\${${num}}`);
}

export function createCallbackFunction(functionString?: string, event?: string): NotificationCallback {
	if (functionString == null) return () => {};
	
	for (let generatorRule of CallbackGenerators) {
		if (testGeneratorRule(functionString, generatorRule)) {
			return generatorRule.generator(getGeneratorParameters(functionString, generatorRule), event);
		}
	}
	
	return () => { log(`UNRECOGNIZED COMMAND: ${functionString}`.yellow.bold); };
}
