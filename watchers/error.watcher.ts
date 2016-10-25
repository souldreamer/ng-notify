import { RegexWatcher } from '../shared/regex-watcher';

export class ErrorWatcher extends RegexWatcher {
	constructor() {
		super(
			/.*\bERROR\b.*/mi,
			{
				title: 'ng error',
				message: '$0',
				wait: false
			}
		);
	}
}