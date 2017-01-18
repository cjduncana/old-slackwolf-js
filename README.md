# Slackwolf

A Slack bot that moderates Werewolf games.

## Quick Start

To use this code you will need [Node.js][node] and [Docker][docker].
This code has been tested on Node.js v6.0.0 and Docker v1.11.1.
After starting the Docker machine, do the following:

``` bash
$ npm run docker:init
```

This will upgrade the Docker containers to their latest version, start all the
containers, and log you into the Slackwolf container.
Once inside, download all the dependencies from npm.

``` bash
$ npm install
```

Place in the root directory a `.env` file containing Slack Bot's token.

```
TOKEN=put_token_here
```

Once the token is introduced, run the migrations and then start the bot.

``` bash
$ npm run migrate
$ npm start
```

## Testing, Debugging and Coverage

This app contains tests that can be run with the following commands.
__Note:__ Prepend the commands with `npm run`.

| Commands      | Explanation                               |
| ------------- | ----------------------------------------- |
| test          | Run the test located in the `test` folder |
| test:debug    | Debug your tests                          |
| coverage      | Provide a coverage report                 |
| coverage:open | Open coverage report in your browser      |

More commands can be found in the `package.json` file.

### Note

When debugging your tests, the database will not be clean when the debugger is
restarted, so it is suggested that you exit the debugger instead and then run
the `test:debug` command.

[docker]: https://www.docker.com/
[node]: https://nodejs.org/en/
