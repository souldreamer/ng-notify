import { Watcher, NotificationCallback } from '../shared/watchers';

export interface WatcherParameters {
	title?: string;
	message?: string;
	icon?: string;
	sound?: boolean;
	onExecute?: string;
	onClick?: string;
	onTimeout?: string;
	variables?: WatcherConfigurationVariables;
	[otherParameterName: string]: any;
}

export interface WatcherListeners {
	onExecute?: NotificationCallback;
	onClick?: NotificationCallback;
	onTimeout?: NotificationCallback;
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
