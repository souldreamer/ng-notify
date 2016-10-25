import { RegexWatcher } from '../shared/regex-watcher';
import { Watcher } from '../shared/watchers';

export class AllWatcher extends RegexWatcher {
	constructor(private styleOverride: any) {
		super(/.*/, Watcher.extendStyle(styleOverride, {message: '$0', wait: false}));
	}
}
