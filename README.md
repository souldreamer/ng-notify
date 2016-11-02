# CLI notifier
Small project that wraps around `CLI` commands to capture their
output and when encountering certain situations show a notification about
the event.

Started as a project specific to `angular-cli`, but evolved quite a bit
since then. Out-of-the-box support for `ember-cli` and `create-react-app`
is coming soon.


## Installation
For now:
- clone the project
- run `npm install -g`
- run `tsc && npm install -g && npm link`

_Note_: will not currently compile. Still waiting for `@types/deep-assign`
to be published to the npm registry. Until then, one possible solution is
to just copy the [DefinitelyTyped/deep-assign](https://github.com/DefinitelyTyped/DefinitelyTyped/tree/types-2.0/deep-assign)
folder from _DefinitelyTyped_ to `node_modules/@types` before running `tsc`.


### Usage
Run `noti-cli <cli params for the cli command defined in your noti-cli.config file>`
in your working project folder.

When you have multiple configurations in your directory tree, set the first
parameter of `noti-cli` to `cli:`*`cli_name`* to load `noti-cli.cli_name.json`
as a configuration file (e.g. `noti-cli cli:ng ...` will load the configuration
from `noti-cli.ng.json` either from your current working directory tree, or as
a last try, from the `noti-cli` directory).

`noti-cli` will automatically run the cli command defined in the configuration file
and pass onto it all the parameters you supplied `noti-cli` except for the `cli:...`
parameter, if present.
