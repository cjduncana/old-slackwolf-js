# Slackwolf

A Slack bot that moderates Werewolf games.

## Quick Start

To use this code you will need [Node.js][node] and [Docker][docker]. This code
has been tested on Node.js v6.0.0 and Docker v1.11.1.

``` bash
$ npm run docker:init
```

This will upgrade the Docker containers to their latest version, start all the
containers, and log you into the Slackwolf container. Once inside, download all
the dependencies from npm.

``` bash
$ npm install
```

Place in the root directory a `.env` file containing Slack Bot's token.

```
TOKEN=put_token_here
```

Once the token is introduced, start the bot.

``` bash
$ npm start
```

[docker]: https://www.docker.com/
[node]: https://nodejs.org/en/
