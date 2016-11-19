# Nodejs Chat Tutorial

## Goal
Create a minimal barebone chat app in heroku. This is the [tutorial](https://devcenter.heroku.com/articles/node-websockets).

## Requirements
- Node (>= 4)
- NPM (or yarn)

## Installation
```bash
$ npm install
$ npm start
```

Or if you have `yarn` installed
```bash
$ yarn install
$ yarn start
```

## Deploying to heroku
```bash
$ git push heroku master
```

## Features
- Chat histories are now cached, we can store up to 20 messages.
- Displaying logs when users are connected and typing.
- Prompting user for proper username.

## Roadmap (aka nice-to-have things)
- [ ] Client recognition on the server side.
- [ ] Should we cache the logs too?
- [ ] Use proper frontend framework (e.g. React, Vue, Angular, or whatever is hip) so that we don't have to worry about implementing UX stuff (like changing data or state).
- [ ] *After* establishing proper frontend framework, we can do nice stuff like markdown, github integration, list of online users.
