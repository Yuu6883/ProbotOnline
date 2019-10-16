module.exports = class BotSocket {
    constructor() {
        /** @type {WebSocket} */
        this.socket = null;
    }

    /** @param {string} url */
    connect(url) {
        this.disconnect();

        this.socket = new WebSocket(url);
        this.initEvents();
    }

    initEvents() {
        this.socket.onopen = () => {
            console.log("Socket open");
        };

        this.socket.onmessage = message => {
            console.log(message);
        };

        this.socket.onclose = () => {
            console.log("Socket closed");
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

}