import 'colors';
import * as util from 'util';

const envVars = Object.keys(process.env).map(key => key.toLowerCase());
const verboseLog = console.log.bind(console);
const silentLog = (message?: any, ...optionalParams: any[]): void => {};

export const inspect = util.inspect;
export const log = envVars.indexOf('verbose') === -1 ? silentLog : verboseLog;
