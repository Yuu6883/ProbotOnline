const VM = require("vm");

const x = {"J":11,"Q":12,"K":13,"A":14};
const rankToNumber = rank => {
    if (isNaN(rank)) return x[rank.toUpperCase()];
    return ~~rank;
}

const s = {"C":"♣","D":"♦","H":"♥","S":"♠"};

/**
 * @param  {{rank: string, type: "D"|"S"|"H"|"C"}[]} cards
 */
const cardsToString = (...cards) => {
    if (Array.isArray(cards[0])) return cardsToString(...cards[0]);
    return cards.map(card => `${s[card.type]}${card.rank}`).join("|") || "Empty";
}

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
                rankToNumber, cardsToString,
                console: console
            }, {
                timeout: 5000,
                filename: "probot.js"
            });
        }

        VM.runInNewContext(script, this.context);
    }
}