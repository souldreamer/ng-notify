import { inspect, log } from '../shared/logger';
import { Watcher } from '../shared/watchers';
import {
	WatcherConfiguration, WatcherConfigurationMap, Configuration, StreamWatchers
} from './interfaces';
import { createWatcher } from '../shared/watcher.factory';

function isSkipMany(parameter: string): boolean {
	return parameter.trim() === '*';
}
function isSkipOne(parameter: string): boolean {
	return parameter.trim() === '?';
}
function isSkipAny(parameter: string): boolean {
	return isSkipOne(parameter) || isSkipMany(parameter);
}

export function parametersMatch(parameters: string[] | undefined, argv: string[]): boolean {
	if (parameters == null) return true;

	let argvIndex = 0;
	for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++, argvIndex++) {
		if (parameterIndex >= argv.length || argvIndex >= argv.length) {
			return parameters.slice(parameterIndex).every(isSkipMany);
		}

		let parameter = parameters[parameterIndex].trim();
		if (isSkipMany(parameter)) {
			let numSkipOne = 0;
			while (parameterIndex < parameters.length && isSkipAny(parameters[parameterIndex])) {
				if (isSkipOne(parameters[parameterIndex])) numSkipOne++;
				parameterIndex++;
			}
			if (parameterIndex === parameters.length) return true;

			parameter = parameters[parameterIndex].trim();
			argvIndex += numSkipOne;
			while (argvIndex < argv.length && argv[argvIndex] !== parameter) argvIndex++;
			if (argvIndex >= argv.length) return false;

			continue;
		}
		if (isSkipOne(parameter)) continue;
		if (parameter !== argv[argvIndex]) return false;
	}
	return true;
}

function getWatchers(
	watcherList: (string | WatcherConfiguration)[],
	globalWatchers: WatcherConfigurationMap
): Watcher[] {
	const watchers: Watcher[] = [];
	
	watcherList.forEach((watcher: string | WatcherConfiguration) => {
		const isString = typeof watcher === 'string';
		const name = isString ? <string>watcher : (<WatcherConfiguration>watcher).name;
		const parameters = isString ? undefined : (<WatcherConfiguration>watcher).parameters;
		
		let globalWatcher = name == null ? null : globalWatchers.get(name);
		if (globalWatcher == null) {
			if (typeof watcher === 'string' || !watcher.type) return null;
			globalWatcher = { name: '', type: watcher.type, parameters: watcher.parameters || {}};
		}

		const watcherInstance = createWatcher(globalWatcher, parameters);
		if (watcherInstance != null) watchers.push(watcherInstance);
	});
	return watchers;
}

function getWatcherConfigurationMap(configuration: Configuration): WatcherConfigurationMap {
	let watcherConfigurationMap: WatcherConfigurationMap = new Map();
	
	(configuration.watchers || <WatcherConfiguration[]>[]).forEach(watcher => {
		if (watcher.name == null) return;
		
		watcherConfigurationMap.set(watcher.name, watcher);
	});
	return watcherConfigurationMap;
}

export function parseConfiguration(configuration: Configuration, argv: string[]): StreamWatchers {
	let stderrWatchers: Watcher[] = [];
	let stdoutWatchers: Watcher[] = [];
	let globalWatchers: WatcherConfigurationMap = getWatcherConfigurationMap(configuration);
	
	if (!configuration || !configuration.cliCommands) return {stderr: [], stdout: []};

	configuration.cliCommands.forEach(command => {
		log('parseConfiguration: considering command: '.yellow, inspect(command, false, 10, true));
		if (![
			command.cliParameters,
			...(command.aliases != null ? command.aliases.map(alias => alias.cliParameters) : [])
		].some(cliParameters => parametersMatch(cliParameters, argv))) return;
		log('configuration applies'.black.bgYellow);
		
		stderrWatchers.push(...getWatchers(command.watchers.stderr || [], globalWatchers));
		stdoutWatchers.push(...getWatchers(command.watchers.stdout || [], globalWatchers));
	});

	return {
		stderr: stderrWatchers,
		stdout: stdoutWatchers
	};
}
