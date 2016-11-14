import { WatcherConfigurationVariables } from '../configuration/interfaces';
import * as moment from 'moment';
import 'moment-duration-format';
import { evaluateStringTemplate, PipeFunction } from 'string-template-parser';

const PIPES: {[pipeName: string]: PipeFunction} = {
	'time-difference': timeDifference,
	'time-difference-exact': timeDifferenceExact,
	'date': showDate
};

export function replaceVariables(text: string, variables: WatcherConfigurationVariables): string {
	return evaluateStringTemplate(text, variables, PIPES);
}

function timeDifference(value: string): string {
	return moment(value).fromNow(true);
}

function timeDifferenceExact(value: string): string {
	// hack because type definitions for moment-duration-format don't seem to be working
	return (<any>moment.duration(moment().diff(moment(value))))
		.format('d [days], h[h]m[m]s.S[s]');
}

function showDate(value: string, parameters: string[]): string {
	if (parameters.length < 2) return moment(value).format();
	return moment(value).format(parameters[0]);
}
