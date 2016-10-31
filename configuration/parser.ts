import { Watcher, AugmentedNotificationCallback } from '../shared/watchers';
import { RegexWatcher } from '../shared/regex.watcher';
import * as deepAssign from 'deep-assign';

// TODO: extend this with all the Notification parameters
// NOTE: there can also be other parameters, not just these
//       (especially watcher-type specific parameters)
interface WatcherParameters {
	title?: string;
	message?: string;
	onClick?: string;
	onTimeout?: string;
	variables?: WatcherConfigurationVariables;
	[otherParameterName: string]: any;
}

interface CliWatchers {
	stderr?: (string | WatcherConfiguration)[];
	stdout?: (string | WatcherConfiguration)[];
}

interface CliCommand {
	cliParameters: string[];
	watchers: CliWatchers;
}

interface WatcherConfigurationVariables {
	[variable: string]: string;
}

interface WatcherConfiguration {
	name: string;
	type: string;
	parameters: WatcherParameters
}

export interface Configuration {
	cli: string;
	cliCommands: CliCommand[];
	watchers?: WatcherConfiguration[];
}

export interface StreamWatchers {
	stderr: Watcher[];
	stdout: Watcher[];
}

type WatcherConfigurationMap = Map<string, WatcherConfiguration>;

function parametersMatch(parameters: string[], argv: string[]): boolean {
	for (let parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
		let parameter = parameters[parameterIndex].trim();
		if (parameter === '') continue;
		if (parameter !== argv[parameterIndex]) return false;
	}
	return true;
}

function createCallbackFunction(functionString: string): AugmentedNotificationCallback {
	return () => { console.log(functionString); };
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
				createCallbackFunction(actualParameters.onClick),
				createCallbackFunction(actualParameters.onTimeout)
			);
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

export function parseConfiguration(configuration: Configuration): StreamWatchers {
	let argv = process.argv.slice(2);
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
