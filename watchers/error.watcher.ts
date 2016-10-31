import { RegexWatcher } from '../shared/regex.watcher';

export class ErrorWatcher extends RegexWatcher {
	constructor() {
		super(
			/.*\d(ERROR\b.*)/m,
			{
				title: 'ng error',
				message: '$1',
				wait: false
			}
		);
	}
}