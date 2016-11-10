Introduction
------------

Tic-Tac-Toe! is a Slack Slash Command that allows team members to play a fun game of Tic-Tac-Toe in any channel.

It has the following dependencies:

"@slack/client": "^3.6.0",
"body-parser": "^1.15.2",
"express": "^4.14.0",
"morgan": "^1.7.0",
"request": "^2.75.0"

Note that my instance of this project is running on Heroku and my server 'sleeps' after long periods of inactivity. It might take a couple of /ttt calls to get a response.


Example
-------

`/ttt help`  displays list of commands
`/ttt rules` displays list of rules


Installation
------------

- Follow the setup instructions at https://api.slack.com/slash-commands
- Set up an instance of this project on Heroku or similar platforms
- Set the POST url for your slash command to the url you set up
- Remember to set enviroment variables for your TOKEN_FROM_SLACK, TOKEN_TO_SLACK, and TEAM_ID


Tests
-----

run `npm test`


Contributors
------------

Written by Layomi Akinrinade - https://github.com/layomia
