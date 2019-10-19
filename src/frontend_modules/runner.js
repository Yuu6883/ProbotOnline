const VM = require("vm");

module.exports = class Runner {

    /** 
     * @param {import("./ws")} socket 
     * @param {string} script
     */
    static run(socket, script) {

        if (!this.context) {
            this.context = VM.createContext({
                bet: socket.sendBet.bind(socket),
                getState: () => socket.data,
                getHistory: () => socket.history,
                console: console
            }, {
                timeout: 5000,
                filename: "probot.js"
            });
        }

        VM.runInNewContext(script, this.context);
    }
}