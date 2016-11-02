import { NodeNotifier, Notification, notify } from 'node-notifier';
import { WatcherParameters, WatcherConfigurationVariables } from '../configuration/interfaces';
import * as deepAssign from 'deep-assign';
import { replaceVariables } from './pipes';

export interface AugmentedNotificationCallback {
	(err: any, response: any, variables: WatcherConfigurationVariables): any;
}

interface StringIndexedObject {
	[index: string]: any;
}

export abstract class Watcher {
	constructor(protected parameters: WatcherParameters) {}
	
	execute(text: string, variables: WatcherConfigurationVariables): void {}
	
	protected static extendStyle(baseStyle: any, extendedStyle: any): any {
		return deepAssign({}, baseStyle, extendedStyle);
	}
	
	protected setSpecialVariables(variables: WatcherConfigurationVariables) {
		for (let variable in this.parameters.variables) {
			switch (this.parameters.variables[variable].trim()) {
				case 'Date.now':
					variables[variable] = (new Date()).toISOString();
					break;
				default:
					break;
			}
		}
	}
}

export abstract class NotifyingWatcher extends Watcher {
	constructor(
		parameters: WatcherParameters,
		protected onClick: AugmentedNotificationCallback = () => {},
		protected onTimeout: AugmentedNotificationCallback = () => {}
	) {
		super(parameters);
	}
	
	showNotification(
		notification: Notification,
		variables: WatcherConfigurationVariables
	): NodeNotifier {
		const notificationStyle: Notification = notification || <any>this.parameters;
		this.replaceNotificationVariables(notificationStyle, variables);
		
		const notifier = notify(notificationStyle, (err: any, res: string) => {
			switch (res) {
				case 'activate':
					this.onClick(err, res, variables);
					break;
				case 'timeout':
					this.onTimeout(err, res, variables);
					break;
			}
		});
		
		return notifier;
	}
	
	protected replaceNotificationVariables(
		notification: Notification,
		variables: WatcherConfigurationVariables
	): void {
		let notif = <StringIndexedObject>notification;
		for (let notificationProperty in notif) {
			if (typeof notif[notificationProperty] !== 'string') continue;
			notif[notificationProperty] =
				replaceVariables(notif[notificationProperty], variables);
		}
	}
}