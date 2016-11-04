import { NotifyingWatcher } from './watchers';
import {
	WatcherConfigurationVariables, WatcherParameters, WatcherListeners
} from '../configuration/interfaces';
import { replaceVariables } from './pipes';
import * as deepAssign from 'deep-assign';
import { log, inspect } from './logger';

export class RegexWatcher extends NotifyingWatcher {
	constructor(
		protected regex: RegExp,
		parameters: WatcherParameters,
	    listeners: WatcherListeners = {}
	) {
		super(parameters, listeners);
		log('Creating regex watcher'.green, inspect(regex).cyan, inspect(parameters).grey);
	}
	
	execute(text: string, variables: WatcherConfigurationVariables): void {
		let matches = text.match(this.regex);
		if (matches == null) return;
		
		log('Executing RegexWatcher'.yellow.bold, text, inspect(this.regex).yellow, inspect(matches).grey.bold);
		log(inspect(variables).grey);
		this.setMatchVariables(variables, matches);
		this.setSpecialVariables(variables);
		this.showNotification(this.replaceStyle(matches), variables);
		this.listeners.onExecute(variables);
	}
	
	private replaceStyle(matches: RegExpMatchArray): any {
		let computedStyle: any = Object.assign({}, this.parameters);
		for (let property in computedStyle) {
			if (computedStyle.hasOwnProperty(property) && typeof computedStyle[property] === 'string') {
				computedStyle[property] = (<string>computedStyle[property]).replace(/\$(\d+)/gi, (match, num) => matches[+num]);
			}
		}
		return computedStyle;
	}
	
	static regexMatchToWatcherVariables(matches: RegExpMatchArray): WatcherConfigurationVariables {
		let variables: WatcherConfigurationVariables = {};
		for (let index = 0; index < matches.length; index++) {
			variables[index.toString()] = matches[index];
		}
		return variables;
	}
	
	protected setMatchVariables(variables: WatcherConfigurationVariables, matches: RegExpMatchArray) {
		for (let variable in this.parameters.variables) {
			variables[variable] = replaceVariables(
				this.parameters.variables[variable].replace(/\$(\d+)/gi, (match, num) => `\${${num}}`),
				deepAssign({}, variables, RegexWatcher.regexMatchToWatcherVariables(matches))
			);
		}
	}
}