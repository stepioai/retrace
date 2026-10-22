// Vercel entry: every request is rewritten here (vercel.json). The Nest app is
// built once per warm instance and reused for later requests.
const { createServer } = require("../dist/server");

let ready;

module.exports = async (req, res) => {
    // Vercel puts its own lazy req.cookies on every request. cookie-parser
    // sees it, assumes the work is done and returns early, so the session
    // secret is never set and signed cookies (the login) fail. Clearing it
    // (Vercel's property has a setter) lets cookie-parser run as normal.
    req.cookies = undefined;
    ready = ready || createServer();
    const server = await ready;
    server(req, res);
};
