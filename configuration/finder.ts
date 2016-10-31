import { sync as globSync } from 'glob';
import * as path from 'path';
import * as process from 'process';

function existsConfiguration(directory: string, filename: string): string {
	let files = globSync(
		path.join(directory, filename),
		{
			nodir: true,
			silent: true
		});
	return files[0];
}

export function findConfigurationFile(filename: string): string {
	let currentDirectory = process.cwd();
	let lastCheckedDirectory = '';
	
	while (currentDirectory !== lastCheckedDirectory) {
		lastCheckedDirectory = currentDirectory;
		let configurationFile = existsConfiguration(currentDirectory, filename);
		if (configurationFile != null) return configurationFile;
		currentDirectory = path.join(currentDirectory, '..');
	}
	
	let packageDirectory = path.join(__dirname, '..');
	let defaultConfigurationFile = existsConfiguration(packageDirectory, filename);
	if (defaultConfigurationFile != null) return defaultConfigurationFile;
	
	return void 0;
}
