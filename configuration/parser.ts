import * as deepAssign from 'deep-assign';
import { Watcher, NotificationCallback } from '../shared/watchers';
import { RegexWatcher } from '../shared/regex.watcher';
import {
	WatcherConfiguration, WatcherParameters, WatcherConfigurationMap, Configuration,
	StreamWatchers, WatcherListeners
} from './interfaces';
import { EndStreamWatcher } from '../shared/end-stream.watcher';
import * as opn from 'opn';
import { replaceVariables } from '../shared/pipes';
import { spawn } from 'child_process';

function parametersMatch(parameters: string[], argv: string[]): boolean {
	for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
		let parameter = parameters[parameterIndex].trim();
		if (parameter === '') continue;
		if (parameter !== argv[parameterIndex]) return false;
	}
	return true;
}

function createCallbackFunction(functionString: string): NotificationCallback {
	if (/^\s*open\s+/i.test(functionString)) {
		return (variables: any) => {
			let openWhat = functionString.match(/^\s*open\s+(.*)$/i)[1];
			opn(replaceVariables(openWhat, variables));
		}
	}
	if (/^\s*run\s+/i.test(functionString)) {
		return (variables: any) => {
			let runWhat = functionString.match(/^\s*run\s+(.*)$/i)[1];
			let runCommand = replaceVariables(runWhat, variables).split(/\s+/);
			spawn(runCommand[0], [...runCommand.slice(1)], {shell: true});
		}
	}
	if (/^\s*(debug\s+\S|debug\s*)/i.test(functionString)) {
		return (variables: any) => {
			let debugMatch = functionString.match(/^\s*debug\s+(.*)$/i);
			if (debugMatch == null) return console.log(variables);
			let debugString = replaceVariables(debugMatch[1], variables);
			console.info(debugString);
		}
	}
	return () => { console.warn(`UNRECOGNIZED COMMAND: ${functionString}`); };
}

function createListeners(parameters: WatcherParameters): WatcherListeners {
	return {
		onExecute: createCallbackFunction(parameters.onExecute),
		onTimeout: createCallbackFunction(parameters.onTimeout),
		onClick: createCallbackFunction(parameters.onClick)
	};
}

function createWatcher(
	configuration: WatcherConfiguration,
    parameters?: WatcherParameters
): Watcher {
	let actualParameters = deepAssign({}, configuration.parameters, parameters);
	
	switch (configuration.type) {
		case 'regex':
			const regexMatch = <string>actualParameters['regex'].match(/^\/(.*)\/([gmi]*)$/i);
			const regex = new RegExp(regexMatch[1], regexMatch[2]);
			return new RegexWatcher(
				regex,
				actualParameters,
				createListeners(actualParameters)
			);
		case 'end-stream':
			return new EndStreamWatcher(
				actualParameters,
				createListeners(actualParameters)
			)
		default:
			throw new Error(`Unrecognized base watcher type (${configuration.type}) for watcher with name '${configuration.name}'!`);
	}
}

function getWatchers(
	watcherParameters: (string | WatcherConfiguration)[],
	globalWatchers: WatcherConfigurationMap
): Watcher[] {
	let watchers: Watcher[] = [];
	watcherParameters.forEach((wp: string | WatcherConfiguration) => {
		if (typeof wp === 'string') {
			watchers.push(createWatcher(globalWatchers.get(wp)));
			return;
		}
		watchers.push(createWatcher(globalWatchers.get(wp.name), wp.parameters));
	});
	return watchers;
}

function getWatcherConfigurationMap(configuration: Configuration): WatcherConfigurationMap {
	let watcherConfigurationMap: WatcherConfigurationMap = new Map();
	
	(configuration.watchers || <WatcherConfiguration[]>[]).forEach(watcher => {
		watcherConfigurationMap.set(watcher.name, watcher);
	});
	return watcherConfigurationMap;
}

export function parseConfiguration(configuration: Configuration, argv: string[]): StreamWatchers {
	let stderrWatchers: Watcher[] = [];
	let stdoutWatchers: Watcher[] = [];
	let globalWatchers: WatcherConfigurationMap = getWatcherConfigurationMap(configuration);
	
	configuration.cliCommands.forEach(command => {
		if (!parametersMatch(command.cliParameters, argv)) return;
		
		stderrWatchers.push(...getWatchers(command.watchers.stderr, globalWatchers));
		stdoutWatchers.push(...getWatchers(command.watchers.stdout, globalWatchers));
	});
	
	return {
		stderr: stderrWatchers,
		stdout: stdoutWatchers
	};
}
