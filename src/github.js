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
    // let cards = await Promise.all(
    //     columns.data.map(async column => {
    //         let columnCards = await github.projects.getProjectCards({
    //             column_id: column.id
    //         });
    //         let cardsInfo = await Promise.all(
    //             columnCards.data.map(async card => {
    //                 const number = card.content_url.substring(
    //                     card.content_url.lastIndexOf("/") + 1
    //                 );
    //                 let issue = await github.issues.get({
    //                     owner: process.env.GITHUB_OWNER,
    //                     repo: process.env.GITHUB_REPO,
    //                     number: number
    //                 });
    //                 return {
    //                     number: issue.data.number,
    //                     title: issue.data.title,
    //                     updated_at: issue.data.updated_at,
    //                     column: column.title
    //                 };
    //             })
    //         );
    //         return {
    //             column: column.name,
    //             cards: cardsInfo
    //         };
    //     })
    // );
};
