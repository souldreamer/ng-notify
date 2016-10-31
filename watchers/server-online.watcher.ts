import { RegexWatcher } from '../shared/regex.watcher';
import * as opn from 'opn';

export class ServerOnlineWatcher extends RegexWatcher {
	constructor() {
		super(
			/\*\*.*(http:\/\/.*:\d+).*\*\*/i,
			{
				title: '`ng serve` started',
				message: 'Server started at $1',
				wait: true
			},
			(err, res, info) => {
				opn(info[1]);
				console.log('opening website');
			}
		)
	}
}