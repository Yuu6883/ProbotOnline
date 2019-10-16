const { WebSocketServer } = require("@clusterws/cws");
const Config = require("../../../../config").WS;
const Logger = require("./Logger");

module.exports = class BotServer {

    constructor() {
        this.config = Config;
        this.logger = new Logger();

        /** @type {WebSocket[]} */
        this.connections = [];
    }

    /** @param {import("http").Server} server */
    init(server) {
        if (server) {
            this.server = new WebSocketServer({
                server,
                path: "/u/",
                // verifyClient: this.verifyClient.bind(this)
            }, () => {
                this.logger.info("Bot websocket server open");
            });
        } else {
            this.server = new WebSocketServer({
                port: this.config.port,
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
        console.log(info.req.headers.cookie);
        next();
    }

    initEvents() {
        this.server.on("connection", (socket, req) => {

            console.log(req);

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