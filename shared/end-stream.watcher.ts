import { NotifyingWatcher, AugmentedNotificationCallback } from './watchers';
import { WatcherParameters, WatcherConfigurationVariables } from '../configuration/interfaces';

export class EndStreamWatcher extends NotifyingWatcher {
	endStream: true;
	
	constructor(
		parameters: WatcherParameters,
		onClick: AugmentedNotificationCallback = () => {},
		onTimeout: AugmentedNotificationCallback = () => {}
	) {
		super(parameters, onClick, onTimeout);
	}
	
	execute(text: string, inputVariables?: WatcherConfigurationVariables): WatcherConfigurationVariables {
		this.showNotification(this.parameters);
	}
}