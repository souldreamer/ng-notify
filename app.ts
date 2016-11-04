#!/usr/bin/env node
import * as fs from 'fs';
import WritableStream = NodeJS.WritableStream;
import { spawn } from 'child_process';
import { Watcher } from './shared/watchers';
import { findConfigurationFile } from './configuration/finder';
import { parseConfiguration } from './configuration/parser';
import { Configuration } from './configuration/interfaces';
import { EndStreamWatcher } from './shared/end-stream.watcher';
import { log, inspect } from './shared/logger';

export function main(argv: string[]) {
	const cliParameterMatch = argv[2].match(/^cli:(.*)$/i);
	const cliName = cliParameterMatch == null ? '' : cliParameterMatch[1];
	const configurationFilename = cliParameterMatch == null ? 'noti-cli.json' : `noti-cli.${cliName}.json`;
	const cliArguments = argv.slice(cliParameterMatch == null ? 2 : 3);
	
	const configurationFile = findConfigurationFile(configurationFilename);
	const configurationFileContents = fs.readFileSync(configurationFile).toString();
	const configuration = <Configuration>JSON.parse(configurationFileContents);
	const { stderr: stderrWatchers, stdout: stdoutWatchers } = parseConfiguration(configuration, cliArguments);
	
	let watcherVariables = {};
	
	function dealWithBlock(block: Buffer | string, watchers: Watcher[], stream?: WritableStream) {
		if (stream != null && block != null) stream.write(block);
		
		let text = block == null ? '' : block.toString();
		watchers.forEach(watcher => watcher.execute(text, watcherVariables));
	}
	
	function splitStreamWatchersByEvent(watchers: Watcher[]): {data: Watcher[], end: Watcher[]} {
		return {
			data: watchers.filter(watcher => (<EndStreamWatcher>watcher).endStream !== true),
			end:  watchers.filter(watcher => (<EndStreamWatcher>watcher).endStream === true)
		}
	}
	
	let ngServe = configuration.cli == null || configuration.cli.trim().length === 0 ?
	              spawn(cliArguments[0], [...cliArguments.slice(1)]) :
	              spawn(configuration.cli, [...cliArguments], { shell: true });
	
	ngServe.on('error', (err: any) => {
		console.error(err);
	});
	
	ngServe.on('close', () => {
		process.exit(0);
	});
	
	const {data: stdoutDataWatchers, end: stdoutEndWatchers} = splitStreamWatchersByEvent(stdoutWatchers);
	const {data: stderrDataWatchers, end: stderrEndWatchers} = splitStreamWatchersByEvent(stderrWatchers);
	
	log('*** STDOUT WATCHERS ***'.red.bold);
	log('DATA:'.bgRed.black.bold, inspect(stdoutDataWatchers, false, 10, true));
	log('END:'.bgRed.black.bold, inspect(stdoutEndWatchers, false, 10, true));
	log('*** STDERR WATCHERS ***'.red.bold);
	log('DATA:'.bgRed.black.bold, inspect(stderrDataWatchers, false, 10, true));
	log('END:'.bgRed.black.bold, inspect(stderrEndWatchers, false, 10, true));
	
	ngServe.stdout.on('data', block => dealWithBlock(block, stdoutDataWatchers, process.stdout));
	ngServe.stdout.on('end', block => dealWithBlock(block, stdoutEndWatchers));
	ngServe.stderr.on('data', block => dealWithBlock(block, stderrDataWatchers, process.stderr));
	ngServe.stderr.on('end', block => dealWithBlock(block, stderrEndWatchers));
	process.stdin.on('data', (data: Buffer) => ngServe.stdin.write(data));
	
	log(`Loading configuration file from: ${configurationFile}`.bold.black.bgWhite);
}

main(process.argv);
