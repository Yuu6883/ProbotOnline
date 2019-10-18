const BET_OP_CODE  = 1;
const LOG_OP_CODE  = 2;
const DATA_OP_CODE = 3;
const LATE_OP_CODE    = 253;
const TIMEOUT_OP_CODE = 254;
const NO_GAME_OP_CODE = 255;

module.exports = class BotConnection {

    /**
     * @param {import("./BotServer")} server
     * @param {ClientUser} user
     * @param {import("@clusterws/cws").WebSocket} socket
     */
    constructor(server, user, socket) {
        this.server = server;
        this.user = user;
        this.socket = socket;
        /** @type {{ req: import("express").Request, res: import("express").Response }} */
        this.handle = null;
        /** @type {{bet: number, leave: boolean}} */
        this.result = null;
        this.initSocket();
    }

    initSocket() {
        this.socket.on("message", data => {
            let view = new DataView(data);
            
            if (view.getUint8(0) == BET_OP_CODE) {
                this.onBet(view.getUint32(1));
            }
        });
    }

    /** @param {number} bet */
    onBet(bet) {

        if (!this.handle)
            return this.informNogame();

        // Expired
        if (this.handle.res.headersSent)
            return this.informLate();

        let leave = false;
        if (bet == 0xFFFFFFFF) {
            leave = true;
            bet = 0;
        }

        this.sendLog(leave ? "Leaving game" : `Betting ${bet}`);

        this.handle && this.handle.res.send({ bet, leave });
    }

    get username() {
        if (!this.user || !this.user.type) return;

        switch (this.user.type) {

            case "discord":
                return `Discord: ${this.user.username}#${this.user.discriminator}`;
            
            case "facebook":
                return "Facebook: " + this.user.name;

            case "google":
                return "Google: " + this.user.given_name;

            default:
                return "Unknown"
        }
    }

    send(data) {
        try {
            this.socket.send(data);
        } catch(e) {
            this.server.logger.onError(e);
        }
    }

    /**
     * @param {DataView} view 
     * @param {string} string
     * @param {number} startOffset 
     */
    writeUTF8(view, string, startOffset) {
        startOffset = startOffset || 0;

        for (let i = 0; i < string.length; i++)
            view.setUint8(i + startOffset, string.charCodeAt(i));
        return view;
    }

    sendBody(body) {
        
        let string = JSON.stringify(body);
        let buffer = new ArrayBuffer(1 + string.length);
        let view = new DataView(buffer);

        view.setUint8(0, DATA_OP_CODE);
        this.writeUTF8(view, string, 1);

        this.send(buffer);
    }

    /** @param {string} log */
    sendLog(log) {
        let buffer = new ArrayBuffer(1 + log.length);
        let view = new DataView(buffer);

        view.setUint8(0, LOG_OP_CODE);
        this.writeUTF8(view, log, 1);

        this.send(buffer);
    }

    informLate() {
        let view = new DataView(new ArrayBuffer(1));
        view.setUint8(0, LATE_OP_CODE);
        this.send(view);
    }

    informTimeout() {
        let view = new DataView(new ArrayBuffer(1));
        view.setUint8(0, TIMEOUT_OP_CODE);
        this.send(view);
    }

    informNogame() {
        let view = new DataView(new ArrayBuffer(1));
        view.setUint8(0, NO_GAME_OP_CODE);
        this.send(view);
    }
}