var request = require("request");

module.exports = function(webhook) {
    this.webhook = webhook || process.env.SLACK_HOOK;

    this.notify = (message, markdown) => {
        markdown = markdown === undefined ? true : markdown;
        request.post(this.webhook, {
            json: { text: message, mrkdwn: markdown }
        });
    };
};
