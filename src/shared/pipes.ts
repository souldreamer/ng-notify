import { WatcherConfigurationVariables } from '../configuration/interfaces';
import * as moment from 'moment';
import 'moment-duration-format';
import { evaluateStringTemplate, PipeFunction } from 'string-template-parser';
import * as _ from 'lodash';

const PIPES: {[pipeName: string]: PipeFunction} = {
	'time-difference': timeDifference,
	'time-difference-exact': timeDifferenceExact,
	'date': showDate,
	'capitalize': _.capitalize,
	'camel-case': _.camelCase,
	'kebab-case': _.kebabCase,
	'lower-case': _.lowerCase,
	'upper-case': _.upperCase,
	'snake-case': _.snakeCase,
	'start-case': _.startCase,
	'to-lower': str => str.toLowerCase(),
	'to-upper': str => str.toUpperCase(),
	'replace': (str, params) => _.chunk(params, 2).reduce((str, params) => _.replace(str, params[0], params[1]), str),
	'replace-exact': (str, params) => _.chunk(params, 2).reduce((str, params) => str === params[0] ? params[1] : str, str),
	'replace-regexp': (str, params) => _.chunk(params, 2).reduce((str, params) => _.replace(str, new RegExp(params[0]), params[1]), str),
	'trim': str => _.trim(str),
	'trim-end': str => _.trimEnd(str),
	'trim-start': str => _.trimStart(str),
	'truncate': truncate
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
	if (parameters.length === 0) return moment(value).format();
	return moment(value).format(parameters[0]);
}

function truncate(value: string, parameters: string[]): string {
	let options: _.TruncateOptions = {};
	if (isNaN(parseInt(parameters[0]))) options.length = parseInt(parameters[0]);
	if (parameters.length > 1) options.omission = parameters[1];
	if (parameters.length > 2) options.separator = parameters[2];
	return _.truncate(value, options);
}