import { Watcher } from '../shared/watchers';

// TODO: extend this with all the Notification parameters
// NOTE: there can also be other parameters, not just these
//       (especially watcher-type specific parameters)
export interface WatcherParameters {
	title?: string;
	message?: string;
	onClick?: string;
	onTimeout?: string;
	variables?: WatcherConfigurationVariables;
	[otherParameterName: string]: any;
}

export interface CliWatchers {
	stderr?: (string | WatcherConfiguration)[];
	stdout?: (string | WatcherConfiguration)[];
}

export interface CliCommand {
	cliParameters: string[];
	watchers: CliWatchers;
}

export interface WatcherConfigurationVariables {
	[variable: string]: string;
}

export interface WatcherConfiguration {
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

export type WatcherConfigurationMap = Map<string, WatcherConfiguration>;
