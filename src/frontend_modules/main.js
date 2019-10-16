const API = require("./api");
const HUD = require("./hud");
const BotSocket = require("./ws");

$(window).on("load", () => {
    HUD.init();
    API.init();
    let socket = new BotSocket();
    window.socket = socket;
});