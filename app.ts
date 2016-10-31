#!/usr/bin/env node
import { spawn } from 'child_process';
import { Watcher } from './shared/watchers';
import WritableStream = NodeJS.WritableStream;
import { findConfigurationFile } from './configuration/finder';
import { parseConfiguration, Configuration } from './configuration/parser';
import * as fs from 'fs';

const configurationFile = findConfigurationFile('ng-notify.json');
const configurationFileContents = fs.readFileSync(configurationFile).toString();
const configuration = <Configuration>JSON.parse(configurationFileContents);
const {stderr: stderrWatchers, stdout: stdoutWatchers} = parseConfiguration(configuration);

function dealWithBlock(block: Buffer | string, watchers: Watcher[], stream: WritableStream) {
	if (stream != null) stream.write(block);
	
	let text = block.toString();
	watchers.forEach(watcher => watcher.execute(text));
}

let ngServe = spawn(configuration.cli, [...process.argv.slice(1)], {shell: true});

ngServe.on('error', (err: any) => {
	console.error(err);
});

ngServe.stdout.on('data', block => dealWithBlock(block, stdoutWatchers, process.stdout));
ngServe.stderr.on('data', block => dealWithBlock(block, stderrWatchers, process.stderr));
process.stdin.on('data', (data: Buffer) => ngServe.stdin.write(data));

console.log(`Loading configuration file from: ${findConfigurationFile('ng-notify.json')}`);
