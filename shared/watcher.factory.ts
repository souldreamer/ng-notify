import { EndStreamWatcher } from './end-stream.watcher';
import { RegexWatcher } from './regex.watcher';
import { WatcherConfiguration, WatcherParameters, WatcherListeners } from '../configuration/interfaces';
import { Watcher } from './watchers';
import * as deepAssign from 'deep-assign';
import { createCallbackFunction } from './callbacks';

interface WatcherFactory {
	(configuration: WatcherConfiguration, parameters: WatcherParameters): Watcher
}

interface WatcherTypeFactory {
	type: string;
	factory: WatcherFactory
}

const RegexWatcherFactory: WatcherTypeFactory = {
	type: 'regex',
	factory: (configuration: WatcherConfiguration, parameters: WatcherParameters) => {
		const regexMatch = <string>parameters['regex'].match(/^\/(.*)\/([gmi]*)$/i);
		const regex = new RegExp(regexMatch[1], regexMatch[2]);
		return new RegexWatcher(
			regex,
			parameters,
			createListeners(parameters)
		);
	}
};

const EndStreamWatcherFactory: WatcherTypeFactory = {
	type: 'end-stream',
	factory: (configuration: WatcherConfiguration, parameters: WatcherParameters) =>
		new EndStreamWatcher(parameters, createListeners(parameters))
};

const WatcherTypeFactories = [
	RegexWatcherFactory,
    EndStreamWatcherFactory
];

export function createWatcher(
	configuration: WatcherConfiguration,
	parameters?: WatcherParameters
): Watcher {
	let actualParameters = deepAssign({}, configuration.parameters, parameters);
	
	for (let typeFactory of WatcherTypeFactories) {
		if (typeFactory.type === configuration.type) {
			return typeFactory.factory(configuration, actualParameters);
		}
	}
	
	throw new Error(`Unrecognized base watcher type (${configuration.type}) for watcher with name '${configuration.name}'!`);
}

function createListeners(parameters: WatcherParameters): WatcherListeners {
	return {
		onExecute: createCallbackFunction(parameters.onExecute, 'EXE'),
		onTimeout: createCallbackFunction(parameters.onTimeout, 'OUT'),
		onClick: createCallbackFunction(parameters.onClick, 'CLK')
	};
}
