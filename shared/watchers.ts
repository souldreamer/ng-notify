import { NodeNotifier, Notification, notify } from 'node-notifier';

export interface AugmentedNotificationCallback {
	(err: any, response: any, additionalInformation: any): any;
}

export abstract class Watcher {
	execute(text: string): void {}
	
	protected static extendStyle(baseStyle: any, extendedStyle: any): any {
		return Object.assign({}, baseStyle, extendedStyle);
	}
}

export class NotifyingWatcher extends Watcher {
	constructor(
		protected style: any,
		protected onClick: AugmentedNotificationCallback = () => {},
		protected onTimeout: AugmentedNotificationCallback = () => {}
	) {
		super();
	}
	
	showNotification(notification?: Notification, additionalInformation?: any): NodeNotifier {
		let notificationStyle: Notification = notification || this.style;
		let notifier = notify(notificationStyle, (err: any, res: string) => {
			switch (res) {
				case 'activate':
					this.onClick(err, res, additionalInformation);
					break;
				case 'timeout':
					this.onTimeout(err, res, additionalInformation);
					break;
			}
		});
		notifier.on('click', (err: any, res: any) => this.onClick(err, res, additionalInformation));
		notifier.on('timeout', (err: any, res: any) => this.onTimeout(err, res, additionalInformation));
		
		return notifier;
	}
}