# slack-statistics
[![](https://img.shields.io/github/issues/pvdsp/slack-statistics.svg)]() 
[![](https://img.shields.io/github/issues-pr-closed-raw/pvdsp/slack-statistics.svg)]()
[![GitHub contributors](https://img.shields.io/github/contributors/pvdsp/slack-statistics.svg)]()
[![license](https://img.shields.io/github/license/pvdsp/slack-statistics.svg)]()

**slack-statistics** is a clean and simple display board for your Slack team.
* Made with JavaScript and the Slack API
* Counts the number of messages posted by your team members
* Provides a range of day-by-day insights

## How to use

1. Fill in the `slackToken` variable (in `stats.js`) with your own Slack token. Make sure to use a string!
2. Navigate to the location of `index.html` in your browser.
3. You're ready to go! If data doesn't appear, check if your token has been entered correctly.

## How it works
Brief explanation of how `stats.js` works, to be added as part of documentation

## Getting a token

* You can grab a test token from [here](https://api.slack.com/docs/oauth-test-tokens). 
* When contributing, please remember to [look after](https://labs.detectify.com/2016/04/28/slack-bot-token-leakage-exposing-business-critical-information/) your tokens (beginning with `xoxp`)
* Also, please note the following warning:

> Test tokens are just for you. Never share test tokens with other users or applications. Do not publish test tokens in public code repositories. Review token safety tips.

## Screenshots
![Screenshot](https://i.imgur.com/RN2OcBz.png)
