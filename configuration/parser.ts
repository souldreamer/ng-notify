import { Watcher } from '../shared/watchers';
import {
	WatcherConfiguration, WatcherConfigurationMap, Configuration, StreamWatchers
} from './interfaces';
import { createWatcher } from '../shared/watcher.factory';

function parametersMatch(parameters: string[] | undefined, argv: string[]): boolean {
	if (parameters == null) return true;

	for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
		const parameter = parameters[parameterIndex].trim();
		if (parameter === '') continue;
		if (parameter !== argv[parameterIndex]) return false;
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
		
		const globalWatcher = globalWatchers.get(name);
		if (globalWatcher == null) return null;
		
		const watcherInstance = createWatcher(globalWatcher, parameters);
		if (watcherInstance != null) watchers.push(watcherInstance);
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
		if (![
			command.cliParameters,
			...(command.aliases != null ? command.aliases.map(alias => alias.cliParameters) : [])
		].some(cliParameters => parametersMatch(cliParameters, argv))) return;
		
		stderrWatchers.push(...getWatchers(command.watchers.stderr || [], globalWatchers));
		stdoutWatchers.push(...getWatchers(command.watchers.stdout || [], globalWatchers));
	});
	
	return {
		stderr: stderrWatchers,
		stdout: stdoutWatchers
	};
}
