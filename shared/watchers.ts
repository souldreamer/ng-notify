import { NodeNotifier, Notification, notify } from 'node-notifier';
import { WatcherParameters, WatcherConfigurationVariables, WatcherListeners } from '../configuration/interfaces';
import { replaceVariables } from './pipes';
import { VariableGenerators } from './variables';
import { log, inspect } from './logger';

export interface NotificationCallback {
	(variables: WatcherConfigurationVariables): any | void;
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
		if (this.parameters.variables == null) this.parameters.variables = {};
	}
	
	execute(text: string, variables: WatcherConfigurationVariables): void {}
	
	protected setSpecialVariables(variables: WatcherConfigurationVariables) {
		if (this.parameters.variables == null) return;
		
		log('Setting special variables'.blue.bold, this.parameters.variables, inspect(variables).grey);
		for (let variable in this.parameters.variables) {
			let parameterValue = this.parameters.variables[variable].trim();
			let generator = VariableGenerators[parameterValue];
			log('parameter variable:'.blue, `${variable} = ${parameterValue}`.bold, inspect(generator).grey);
			if (generator != null) {
				variables[variable] = generator();
				log('new value'.green, `${variable} = ${variables[variable]}`.bold);
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
					if (this.listeners.onClick != null) this.listeners.onClick(variables);
					break;
				case 'timeout':
					if (this.listeners.onTimeout != null) this.listeners.onTimeout(variables);
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