# Angular-CLI notifier
Small project that wraps around `angular-cli`s `ng serve` to capture its
output and when encountering certain situations show a notification about
the event.

## Status
- [x] Show on server start & address
    - [x] _Actionable:_ on click, open the default browser to the address
- [ ] Show on error
    - [ ] _Actionable:_ on click, open a generated web page with the errors
    and surrounding lines for context
- [ ] Show on **invalid** webpack state (start re-building)
- [ ] Show on **valid** webpack state ((re-)build finished)
    - [ ] Additionally, show the time it took to (re-)build

Open to suggestion for other notifications & types

#### Extra TODOs:
- [ ] Testing (yes, I know, it should have been here from the start =)
- [ ] Wrap all other `angular-cli` commands and add specific notifications
for them
- [ ] Configuration file to turn on/off the different notifications
- [ ] Add images & sounds to notifications

## Installation
For now, `tsc && npm install -g && npm link`

#### Usage
Run `ngn-serve [other ng params]` in your angular-cli project folder
