import { AugmentedNotificationCallback, NotifyingWatcher } from './watchers';
import { WatcherConfigurationVariables, WatcherParameters } from '../configuration/interfaces';

export class RegexWatcher extends NotifyingWatcher {
	constructor(
		protected regex: RegExp,
		parameters: WatcherParameters,
	    onClick: AugmentedNotificationCallback = () => {},
	    onTimeout: AugmentedNotificationCallback = () => {}
	) {
		super(parameters, onClick, onTimeout);
		console.log('Creating regex watcher', regex, parameters);
	}
	
	execute(text: string, variables: WatcherConfigurationVariables): void {
		let matches = text.match(this.regex);
		if (matches == null) return;
		
		this.setSpecialVariables(variables);
		this.setMatchVariables(variables, matches);
		this.showNotification(this.replaceStyle(matches), variables);
	}
	
	private replaceStyle(matches: RegExpMatchArray): any {
		let computedStyle: any = Object.assign({}, this.parameters);
		for (let property in computedStyle) {
			if (typeof computedStyle[property] === 'string') {
				computedStyle[property] = (<string>computedStyle[property]).replace(/\$(\d+)/gi, (match, num) => matches[+num]);
			}
		}
		return computedStyle;
	}
	
	// TODO: Also pipe-transform this
	protected setMatchVariables(variables: WatcherConfigurationVariables, matches: RegExpMatchArray) {
		for (let variable in this.parameters.variables) {
			variables[variable] = this.parameters.variables[variable].replace(/\$(\d+)/gi, (match, num) => matches[+num]);
		}
	}
}