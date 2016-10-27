import { AugmentedNotificationCallback, NotifyingWatcher } from './watchers';

export class RegexWatcher extends NotifyingWatcher {
	constructor(
		protected regex: RegExp,
		style: any,
	    onClick: AugmentedNotificationCallback = () => {},
	    onTimeout: AugmentedNotificationCallback = () => {}
	) {
		super(style, onClick, onTimeout);
	}
	
	execute(text: string): void {
		let matches = text.match(this.regex);
		if (matches == null) return;
		
		this.showNotification(this.replaceStyle(matches), matches);
	}
	
	private replaceStyle(matches: RegExpMatchArray): any {
		let computedStyle: any = Object.assign({}, this.style);
		for (let property in computedStyle) {
			if (typeof computedStyle[property] === 'string') {
				computedStyle[property] = (<string>computedStyle[property]).replace(/\$(\d+)/gi, (match, num) => matches[+num]);
			}
		}
		return computedStyle;
	}
}