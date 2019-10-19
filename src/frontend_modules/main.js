const API = require("./api");
const HUD = require("./hud");
const BotSocket = require("./ws");
const Runner = require("./runner");

$(window).on("load", () => {

    let socket = new BotSocket();

    socket.on("data", () => Runner.run(socket, HUD.editor.getValue()));

    window.socket = socket;

    API.on("needToLogin", () => console.log("Login to code your probot online"));

    API.on("loginSuccess", () => {
        socket.connect(`${window.origin.replace("http", "ws")}/connect/`);
        HUD.editor.setReadOnly(false);
        HUD.editor.clearSelection();
    });

    API.on("logoutSuccess", () => {
        socket.disconnect();
        HUD.editor.setReadOnly(true);
        HUD.editor.clearSelection();
    });

    HUD.init();
    API.init();
});