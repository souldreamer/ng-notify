import { NodeNotifier, Notification, notify } from 'node-notifier';
import { WatcherParameters, WatcherConfigurationVariables, WatcherListeners } from '../configuration/interfaces';
import * as deepAssign from 'deep-assign';
import { replaceVariables } from './pipes';
import { VariableGenerators } from './variables';

export interface NotificationCallback {
	(variables: WatcherConfigurationVariables): any;
}

interface StringIndexedObject {
	[index: string]: any;
}

export abstract class Watcher {
	constructor(
		protected parameters: WatcherParameters,
	    protected listeners: WatcherListeners
	) {
		if (this.listeners.onExecute == null) this.listeners.onExecute = () => {};
		if (this.listeners.onTimeout == null) this.listeners.onTimeout = () => {};
		if (this.listeners.onClick == null) this.listeners.onClick = () => {};
	}
	
	execute(text: string, variables: WatcherConfigurationVariables): void {}
	
	protected static extendStyle(baseStyle: any, extendedStyle: any): any {
		return deepAssign({}, baseStyle, extendedStyle);
	}
	
	protected setSpecialVariables(variables: WatcherConfigurationVariables) {
		for (let variable in this.parameters.variables) {
			let parameterValue = this.parameters.variables[variable].trim();
			let generator = VariableGenerators[parameterValue];
			if (generator != null) {
				variables[variable] = generator();
			}
		}
	}
}

export abstract class NotifyingWatcher extends Watcher {
	constructor(
		parameters: WatcherParameters,
		listeners: WatcherListeners = {}
	) {
		super(parameters, listeners);
	}
	
	showNotification(
		notification: Notification,
		variables: WatcherConfigurationVariables
	): NodeNotifier {
		const notificationStyle: Notification = notification || <any>this.parameters;
		this.replaceNotificationVariables(notificationStyle, variables);
		notificationStyle.wait = true;
		
		return notify(notificationStyle, (err: any, res: string) => {
			switch (res) {
				case 'activate':
					this.listeners.onClick(variables);
					break;
				case 'timeout':
					this.listeners.onTimeout(variables);
					break;
			}
		});
	}
	
	protected replaceNotificationVariables(
		notification: Notification,
		variables: WatcherConfigurationVariables
	): void {
		let notificationObject = <StringIndexedObject>notification;
		for (let notificationProperty in notificationObject) {
			if (typeof notificationObject[notificationProperty] !== 'string') continue;
			notificationObject[notificationProperty] =
				replaceVariables(notificationObject[notificationProperty], variables);
		}
	}
}