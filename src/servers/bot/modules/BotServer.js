const { WebSocketServer } = require("@clusterws/cws");
const Cookie = require("cookie");
const JWT = require("jsonwebtoken");

module.exports = class BotServer {

    /**
     * @param {APIServer} api
     */
    constructor(api) {
        this.api = api;
        /** @type {WebSocket[]} */
        this.connections = [];
    }

    get config() { return this.api.config }
    get logger() { return this.api.logger }

    /** @param {import("http").Server} server */
    init(server) {
        if (server) {
            this.server = new WebSocketServer({
                server,
                path: "/connect/",
                verifyClient: this.verifyClient.bind(this)
            }, () => {
                this.logger.info("Bot websocket server open");
            });
        } else {
            this.server = new WebSocketServer({
                port: this.config.WS.port,
                // verifyClient: this.verifyClient.bind(this)
            }, () => {
                this.logger.info("Bot websocket server open");
            });
        }

        this.initEvents();
    }

    /**
     * Verify client
     * @param {import("@clusterws/cws").ConnectionInfo} info 
     * @param {import("@clusterws/cws").Listener} next 
     */
    verifyClient(info, next) {

        let cookie = Cookie.parse(info.req.headers.cookie);
        let jwt  = cookie[this.config.API.JWTCookieName];

        try  {
            JWT.verify(jwt, this.config.API.JWTSecret);
            info.req.user = JWT.decode(jwt);

            next(true);
        } catch (_) {
            next(false);
        }
    }

    initEvents() {
        this.server.on("connection", (socket, req) => {

            let user = req.user;
            console.log(user);
            
            this.connections.push(socket);

            this.logger.info(`Client connected from ${socket.remoteAddress}. ` + 
                             `Total connection: ${this.connections.length}`);

            socket.on("close", (code, reason) => {

                this.logger.info(`Client disconnected. ` + 
                                 `Total connection: ${this.connections.length}`);

                this.logger.debug(`Close code: ${code}, reason: ${reason}`);
            });
        });
    }
}