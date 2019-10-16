const express = require("express");
const http = require("http");
const APIServer = require("../src/servers/api");
const BotServer = require("../src/servers/bot/app");

const app = express()
    .use("/", express.static(__dirname + "/../web"))
    .use("/api", APIServer.router);

const server = http.createServer(app);

APIServer.init().then(() => {
    BotServer.init(server);

    server.listen(80, () => {
        APIServer.logger.info(`Web server open`);
        BotServer.init(APIServer.webserver);
    });
});