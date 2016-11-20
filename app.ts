#!/usr/bin/env node
import * as fs from 'fs';
import WritableStream = NodeJS.WritableStream;
import { spawn } from 'child_process';
import { Watcher } from './shared/watchers';
import { findConfigurationFile } from './configuration/finder';
import { parseConfiguration } from './configuration/parser';
import { Configuration, WatcherConfigurationVariables } from './configuration/interfaces';
import { EndStreamWatcher } from './shared/end-stream.watcher';
import { log, inspect, error } from './shared/logger';
import { ChildProcess } from 'child_process';

function fatalError(message: string, err?: Error): void {
	error(message.bold.white.bgRed);
	if (err != null) error(err.message.red);
	process.exit(1);
}

function getConfiguration(filename: string): Configuration {
	const configurationFile = findConfigurationFile(filename);
	if (configurationFile == null) fatalError('Could not find configuration file');
	log(`Loading configuration file from: ${configurationFile}`.bold.black.bgWhite);
	
	try {
		const configurationFileContents = fs.readFileSync(<string>configurationFile).toString();
		return <Configuration>JSON.parse(configurationFileContents);
	} catch (err) {
		fatalError('Could not read or parse configuration file', err);
		return <Configuration>require('./noti-cli.ng.json');
	}
}

function parseArguments(argv: string[]): {configurationFilename: string, cliArguments: string[]} {
	const cliParameterMatch = argv[2].match(/^cli:(.*)$/i);
	const cliName = cliParameterMatch == null ? '' : cliParameterMatch[1];
	const configurationFilename = cliParameterMatch == null ? 'noti-cli.json' : `noti-cli.${cliName}.json`;
	const cliArguments = argv.slice(cliParameterMatch == null ? 2 : 3);
	return {configurationFilename, cliArguments};
}

const watcherVariables: WatcherConfigurationVariables = {};

function setArgvVariables(argv: string[]): void {
	argv.forEach((arg, index) => {
		watcherVariables[`cliParam[${index}]`] = arg;
	});
}

function processBlock(block: Buffer | string, watchers: Watcher[], stream?: WritableStream) {
	if (stream != null && block != null) stream.write(block);
	
	const text = block == null ? '' : block.toString();
	watchers.forEach(watcher => watcher.execute(text, watcherVariables));
}

function splitStreamWatchersByEvent(watchers: Watcher[]): {data: Watcher[], end: Watcher[]} {
	return {
		data: watchers.filter(watcher => !(watcher instanceof EndStreamWatcher)),
		end:  watchers.filter(watcher => watcher instanceof EndStreamWatcher)
	};
}

function wireWatchersToChildProcess(childProcess: ChildProcess, stdoutWatchers: Watcher[], stderrWatchers: Watcher[]) {
	childProcess.on('error', (err: any) => {
		console.error(err);
	});
	
	childProcess.on('close', () => {
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
	
	childProcess.stdout.on('data', block => processBlock(block, stdoutDataWatchers, process.stdout));
	childProcess.stdout.on('end', () => processBlock('', stdoutEndWatchers));
	childProcess.stderr.on('data', block => processBlock(block, stderrDataWatchers, process.stderr));
	childProcess.stderr.on('end', () => processBlock('', stderrEndWatchers));
	process.stdin.on('data', (data: Buffer) => childProcess.stdin.write(data));
}

export function main(argv: string[]) {
	const {configurationFilename, cliArguments} = parseArguments(argv);
	const configuration = getConfiguration(configurationFilename);
	const {stderr: stderrWatchers, stdout: stdoutWatchers} = parseConfiguration(configuration, cliArguments);
	
	let cli: ChildProcess | null = null;
	try {
		setArgvVariables(
			configuration.cli == null || configuration.cli.trim().length === 0 ?
			cliArguments :
			[configuration.cli, ...cliArguments]
		);
		cli =
			configuration.cli == null || configuration.cli.trim().length === 0 ?
			spawn(cliArguments[0], [...cliArguments.slice(1)]) :
			spawn(configuration.cli, [...cliArguments], { shell: true });
	} catch (err) {
		fatalError('Could not create CLI process', err);
	}
	
	if (cli != null) wireWatchersToChildProcess(cli, stdoutWatchers, stderrWatchers);
}

main(process.argv);
