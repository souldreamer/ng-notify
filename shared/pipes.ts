import { WatcherConfigurationVariables } from '../configuration/interfaces';
import * as moment from 'moment';
import 'moment-duration-format';
import { log, inspect } from './logger';

interface Pipe {
	(parameters: string[]): string
}

interface PipeDictionary {
	[pipeName: string]: Pipe
}

const PIPES: PipeDictionary = {
	'time-difference': timeDifference,
	'time-difference-exact': timeDifferenceExact,
	'date': showDate
};

export function pipelineApply(variableString: string, variables: WatcherConfigurationVariables): string {
	let pipeline = variableString.split('|').map(part => part.trim().split(':').map(piece => piece.trim()));
	let value = variables[pipeline[0][0]];
	for (let stage = 1; stage < pipeline.length; stage++) {
		value = PIPES[pipeline[stage][0]]([value, ...pipeline[stage].slice(1)]);
	}
	log('pipeline transform'.bold.blue, variableString, (value||'').bold, inspect(variables).grey);
	return value;
}

export function replaceVariables(text: string, variables: WatcherConfigurationVariables): string {
	return text.replace(
		/\$\{([^}]+)}/i,
		(match, variableString) => pipelineApply(variableString, variables)
	);
}

function timeDifference(parameters: string[]): string {
	return moment(parameters[0]).fromNow(true);
}

function timeDifferenceExact(parameters: string[]): string {
	// hack because type definitions for moment-duration-format don't seem to be working
	return (<any>moment.duration(moment().diff(moment(parameters[0]))))
		.format('d [days], h[h]m[m]s.S[s]');
}

function showDate(parameters: string[]): string {
	if (parameters.length < 2) return moment(parameters[0]).format();
	return moment(parameters[0]).format(parameters.slice(1).join(':'));
}
