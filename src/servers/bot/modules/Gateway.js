const { Router } = require("express");
const BodyParser = require("body-parser");

module.exports = class GatewayServer {

    /** @param {import("./BotServer")} bot */
    constructor(bot) {
        this.bot = bot;
        this.initRouter()
    }

    initRouter() {
        this.router = Router();
        this.router.use(BodyParser.urlencoded({ extended: true }));
        this.router.use(BodyParser.json());
        this.router.use("/:userID/bet", this.onBet.bind(this));
    }

    /**
     * @param {import("express").Request} req 
     * @param {import("express").Response} res 
     */
    onBet(req, res) {
        let userID = req.params["userID"];
        this.bot.setHandle(userID, req, res);
    }

}