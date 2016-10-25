#!/usr/bin/env node
import { spawn } from 'child_process';
import { Watcher } from './shared/watchers';
import { ServerOnlineWatcher, ErrorWatcher, AllWatcher } from './watchers';
import WritableStream = NodeJS.WritableStream;

let ngServe = spawn('ng', ['serve', ...process.argv.slice(2)], {shell: true});

ngServe.on('error', (err: any) => {
	console.error(err);
});

const stderrWatchers = [
	new AllWatcher({title: 'There was an error'})
];
const stdoutWatchers = [
	new ServerOnlineWatcher(),
    new ErrorWatcher()
];

function dealWithBlock(block: Buffer | string, watchers: Watcher[], stream?: WritableStream) {
	if (stream != null) stream.write(block);
	
	let text = block.toString();
	watchers.forEach(watcher => watcher.execute(text));
}

ngServe.stdout.on('data', block => dealWithBlock(block, stdoutWatchers, process.stdout));
ngServe.stderr.on('data', block => dealWithBlock(block, stderrWatchers, process.stderr));
process.stdin.on('data', (data: Buffer) => ngServe.stdin.write(data));
