const { EventEmitter } = require("events");

const BET_OP_CODE  = 1;
const LOG_OP_CODE  = 2;
const DATA_OP_CODE = 3;
const LATE_OP_CODE    = 253;
const TIMEOUT_OP_CODE = 254;
const NO_GAME_OP_CODE = 255;

module.exports = class BotSocket extends EventEmitter {

    constructor() {
        super();

        /** @type {WebSocket} */
        this.socket = null;
        this.history = [];
    }

    /** @param {string} url */
    connect(url) {
        this.disconnect();

        this.socket = new WebSocket(url);
        this.socket.binaryType = "arraybuffer";
        this.initEvents();
    }

    /**
     * 
     * @param {DataView} view 
     * @param {number} startOffset 
     */
    readUTF8(view, startOffset) {
        startOffset = startOffset || 0;

        let str = '';
        for (let i = startOffset; i < view.byteLength; i++)
            str += String.fromCharCode(view.getUint8(i));

        return str;
    }

    initEvents() {
        this.socket.onopen = () => {
            console.log("Connected to gateway server");
        };

        this.socket.onmessage = message => {
            let view = new DataView(message.data);

            switch (view.getUint8(0)) {
                case BET_OP_CODE:
                    console.error("Client should never receive bet data froms server");
                    return this.disconnect();

                case LOG_OP_CODE:
                    console.log(this.readUTF8(view, 1));
                    break;

                case LATE_OP_CODE:
                    console.warn("Received bet after timeout");
                    break;

                case TIMEOUT_OP_CODE:
                    console.warn("Bet timeout");
                    break;

                case NO_GAME_OP_CODE:
                    console.error("Your bot is not in any game");
                    break;

                case DATA_OP_CODE:
                    let string = this.readUTF8(view, 1);
                    let data = JSON.parse(string);
                    this.data = data;
                    this.history.push(data);
                    this.emit("data");
                    console.debug("Received Game State:", data);
                    break;

                default: 
                    console.error(`Unknown event from server: ${view.getUint8(0)}`);
            }
        };

        this.socket.onclose = () => {
            console.log("Disconnected from gateway server");
            this.disconnect();
        }

        this.socket.onerror = e => {
            console.error(e);
            this.disconnect();
        };
    }

    disconnect() {
        if (this.connected)
            this.socket.close();
        this.socket = null;
    }

    get connected() {
        return this.socket && this.socket.readyState === this.socket.OPEN;
    }

    send(data) {
        this.connected && this.socket.send(data);
    }

    /**
     * @param {number} bet 
     */
    sendBet(bet) {
        let buffer = new ArrayBuffer(1 + 4);
        let view = new DataView(buffer);

        if (bet < 0) {
            bet = 0xFFFFFFFF;
        }

        view.setUint8(0, BET_OP_CODE);
        view.setUint32(1, bet);

        this.send(buffer);
    }

}