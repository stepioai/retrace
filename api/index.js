// Vercel entry: every request is rewritten here (vercel.json). The Nest app is
// built once per warm instance and reused for later requests.
const { createServer } = require("../dist/server");

let ready;

// Vercel adds its own helpers to every request and response. They sit on the
// objects themselves, so they hide Express's versions: req.cookies makes
// cookie-parser skip its setup (signed cookies fail), and Vercel's
// res.redirect defaults to 307, which makes the browser repeat a POST (login
// ended on "Cannot POST /app"). Removing them lets Express use its own.
const REQ_HELPERS = ["cookies", "query", "body"];
const RES_HELPERS = ["status", "send", "json", "redirect"];

module.exports = async (req, res) => {
    for (const key of REQ_HELPERS) delete req[key];
    for (const key of RES_HELPERS) delete res[key];
    ready = ready || createServer();
    const server = await ready;
    server(req, res);
};
