const { WebSocketServer } = require("@clusterws/cws");
const Cookie = require("cookie");

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

        return next(true);

        let cookie = Cookie.parse(info.req.headers.cookie);
        let token  = cookie[this.config.API.CookieName];

        if (this.api.users.confirmToken(token)) {
            this.api.users.findByAuthedToken(token).then(userDoc => {
                if (!userDoc) {
                    this.logger.info(`User NOT verified before connection`);
                    next(false);
                } else {
                    info.req.user = userDoc.toObject();
                    this.logger.info(`User verified before connection: ${userDoc.UserID}`);
                    next(true);
                }
            });
        } else {
            next(false);
        }
    }

    initEvents() {
        this.server.on("connection", (socket, req) => {

            let user = req.user;

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