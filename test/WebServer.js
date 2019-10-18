const express = require("express");
const http = require("http");
const APIServer = require("../src/servers/api");
const BotServer = require("../src/servers/bot/app");
const GatewayServer = require("../src/servers/bot/modules/Gateway");

const app = express()
    .use("/", (req, _, next) => {
        APIServer.logger.info(req.originalUrl);
        next();
    })
    .use("/", express.static(__dirname + "/../web"))
    .use("/api", APIServer.router);

const server = http.createServer(app);

APIServer.init().then(() => {

    let botServer = new BotServer(APIServer);
    let gateway = new GatewayServer(botServer);
    botServer.init(server);

    app.use("/u", gateway.router);

    server.listen(80, () => {
        APIServer.logger.info(`Web server open`);
    });
});