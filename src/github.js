const github = require("@octokit/rest")();

module.exports = function() {
    github.authenticate({
        type: "basic",
        username: process.env.GITHUB_USERNAME,
        password: process.env.GITHUB_PASSWORD
    });

    this.init = async () => {
        let columnsData = await github.projects.getProjectColumns({
            project_id: process.env.GITHUB_PROJECT_ID
        });

        this.columns = columnsData.data.reduce(
            (map, column) => ((map[String(column.id)] = column), map),
            {}
        );
    };

    this.getColumnInfo = id => {
        return this.columns[id];
    };

    this.getCardIssue = async card => {
        let number = card.content_url.substring(
            card.content_url.lastIndexOf("/") + 1
        );
        let issue = await github.issues.get({
            owner: process.env.GITHUB_OWNER, // TODO parse from card
            repo: process.env.GITHUB_REPO, // TODO parse from card
            number: number
        });
        return issue.data;
    };

    return this;
};
