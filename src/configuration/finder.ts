import * as path from 'path';
import * as process from 'process';
import * as fs from 'fs';

function findFileInDirectory(directory: string, filename: string): string | null {
	let possibleFileInDirectory = path.join(directory, filename);
	if (fs.existsSync(possibleFileInDirectory)) return possibleFileInDirectory;
	return null;
}

export function findConfigurationFile(filename: string): string | null {
	let currentDirectory = process.cwd();
	let lastCheckedDirectory = '';
	
	while (currentDirectory !== lastCheckedDirectory) {
		lastCheckedDirectory = currentDirectory;
		let configurationFile = findFileInDirectory(currentDirectory, filename);
		if (configurationFile != null) return configurationFile;
		currentDirectory = path.join(currentDirectory, '..');
	}
	
	let packageDirectory = path.join(__dirname, '../..');
	let defaultConfigurationFile = findFileInDirectory(packageDirectory, filename);
	if (defaultConfigurationFile != null) return defaultConfigurationFile;
	
	return null;
}
