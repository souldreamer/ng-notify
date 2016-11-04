import { NotifyingWatcher } from './watchers';
import {
	WatcherParameters, WatcherConfigurationVariables, WatcherListeners
} from '../configuration/interfaces';

export class EndStreamWatcher extends NotifyingWatcher {
	endStream = true;
	
	constructor(
		parameters: WatcherParameters,
	    listeners: WatcherListeners = {}
	) {
		super(parameters, listeners);
	}
	
	execute(text: string, variables: WatcherConfigurationVariables): void {
		console.log('EndStreamWatcher executed');
		this.setSpecialVariables(variables);
		this.showNotification(this.parameters, variables);
		this.listeners.onExecute(variables);
	}
}