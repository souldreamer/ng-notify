import { WatcherConfigurationVariables } from '../configuration/interfaces';
import * as moment from 'moment';

interface Pipe {
	(parameters: string[]): string
}

interface PipeDictionary {
	[pipeName: string]: Pipe
}

const PIPES: PipeDictionary = {
	'time-difference': timeDifference,
	'date': showDate
};

export function pipelineTransform(variableString: string, variables: WatcherConfigurationVariables): string {
	let pipeline = variableString.split('|').map(part => part.trim().split(':').map(piece => piece.trim()));
	let value = variables[pipeline[0][0]];
	for (let stage = 1; stage < pipeline.length; stage++) {
		value = PIPES[pipeline[stage][0]]([value, ...pipeline[stage].slice(1)]);
	}
	return value;
}

export function replaceVariables(text: string, variables: WatcherConfigurationVariables): string {
	return text.replace(
		/\$\{([^}]+)}/i,
		(match, variableString) => pipelineTransform(variableString, variables)
	);
}

function timeDifference(parameters: string[]): string {
	return moment.duration(moment(new Date()).diff(moment(new Date(parameters[0])))).humanize(true);
}

function showDate(parameters: string[]): string {
	if (parameters.length < 2) return moment(parameters[0]).format();
	return moment(parameters[0]).format(parameters[1]);
}