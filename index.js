const dotenv = require("dotenv");
const Koa = require("koa");
const Router = require("koa-router");
const BodyParser = require("koa-bodyparser");
const Github = require("./src/github");
const Slack = require("./src/slack");

// loads enviroment variables from .env file
dotenv.config();

const app = new Koa();
const router = new Router();
const bodyParser = BodyParser();
const github = new Github();
const slack = new Slack();

app.use(bodyParser);

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

router.get("/", async (ctx, next) => {
    ctx.body = "Hello World";
});

router.get("/payload", async (ctx, next) => {
    ctx.body = "Payload";
});

router.post("/payload", async (ctx, next) => {
    let body = ctx.request.body;
    let card = body.project_card;
    if (!card.content_url) {
        ctx.status = 501;
        return;
    }

    let valid = await _parseCard(card, body.action, body.changes);
    ctx.status = valid ? 202 : 501;
});

app.use(router.routes());
app.use(router.allowedMethods());

github.init().then(() => app.listen(process.env.PORT));

const _parseCard = async (card, action, changes) => {
    // if a note card instead of an issue
    if (!card.content_url) {
        return false;
    }

    let issue = await github.getCardIssue(card);
    let message = null;
    let issueText = `*Issue:* <${issue.html_url}|${issue.title}>`;
    if (action === "created") {
        let creator = card.creator.login;
        let newColumn = github.getColumnInfo(card.column_id);
        message = `${issueText} *-* Added to *${
            newColumn.name
        }* by *${creator}*`;
    } else if (action === "moved") {
        let newColumn = github.getColumnInfo(card.column_id);
        let oldColumn = github.getColumnInfo(changes.column_id.from);
        message = `${issueText} *-* *${oldColumn.name} => ${newColumn.name}*`;
    } else if (action === "deleted") {
        message = `${issueText} *-* Removed from project`;
    } else {
        return false;
    }

    message && slack.notify(message);
    return true;
};
