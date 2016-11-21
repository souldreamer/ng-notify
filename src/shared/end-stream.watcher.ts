import { NotifyingWatcher } from './watchers';
import {
	WatcherParameters, WatcherConfigurationVariables, WatcherListeners
} from '../configuration/interfaces';
import { log, inspect } from './logger';

export class EndStreamWatcher extends NotifyingWatcher {
	constructor(
		parameters: WatcherParameters,
		listeners: WatcherListeners = {}
	) {
		super(parameters, listeners);
	}
	
	execute(text: string, variables: WatcherConfigurationVariables): void {
		log('EndStreamWatcher executed'.bold.magenta, inspect(variables).grey);
		this.setSpecialVariables(variables);
		this.showNotification(this.parameters, variables);
		if (this.listeners.onExecute != null) this.listeners.onExecute(variables);
	}
}