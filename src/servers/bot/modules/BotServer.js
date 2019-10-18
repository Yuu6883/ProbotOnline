const { WebSocketServer } = require("@clusterws/cws");
const Cookie = require("cookie");
const JWT = require("jsonwebtoken");

const BotConnection = require("./BotConnection");

module.exports = class BotServer {

    /**
     * @param {APIServer} api
     */
    constructor(api) {
        this.api = api;
        /** @type {import("./BotConnection")[]} */
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
                verifyClient: this.verifyClient.bind(this)
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

            /** @type {ClientUser} */
            let user = req.user;            
            let conn = new BotConnection(this, user, socket);
            this.connections.push(conn)

            this.logger.info(`Client connected from ${socket.remoteAddress}(${this.connections.length}). ` +
                             `User: ${conn.username}(${user.uid})`);

            socket.on("close", (code, reason) => {

                this.connections.splice(this.connections.indexOf(conn), 1);

                this.logger.info(`${conn.username} disconnected (${this.connections.length})`);
                this.logger.debug(`Close code: ${code}, reason: ${reason}`);
            });
        });
    }

    /** @param {string} userID */
    findConnection(userID) {
        return this.connections.find(conn => conn.user.uid == userID);
    }

    /**
     * @param {string} userID 
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     */
    setHandle(userID, req, res) {
        let conn = this.findConnection(userID);

        if (!conn) {
            return res.sendStatus(404);
        } else {
            conn.handle = { req, res };
            conn.sendBody(req.body);

            // Rip
            setTimeout(() => {
                if (!res.headersSent) {
                    // Timeout code
                    res.sendStatus(408);
                    conn.informTimeout();
                }
            }, this.config.WS.betTimeout);
        }
    }
}