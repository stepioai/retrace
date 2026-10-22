// Vercel entry: every request is rewritten here (vercel.json). The Nest app is
// built once per warm instance and reused for later requests.
const { createServer } = require("../dist/server");

let ready;

module.exports = async (req, res) => {
    ready = ready || createServer();
    const server = await ready;
    server(req, res);
};
