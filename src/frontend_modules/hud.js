const API = require("./api");
const { inspect } = require("util");

module.exports = new class HUD {

    constructor() {
        this.terminalElement = $("#console");
    }

    init() {

        API.on("needToLogin",   this.showLoginPanel);
        API.on("loginSuccess",  this.showUserPanel);

        this.editor = ace.edit($("#ide")[0], {
            mode: "ace/mode/javascript",
            selectionStyle: "text"
        });

        window.editor = this.editor;

        this.editor.setTheme("ace/theme/monokai");
        this.editor.setFontSize(24);
        this.editor.setReadOnly(true);
        this.editor.setValue(localStorage.code || "");

        $(document).bind('keydown', e => {
            if(e.ctrlKey && (e.which == 83)) {
              e.preventDefault();
              this.saveCode();
              return false;
            }
        });

        $(".facebook-login").click(() => API.redirectLogin("facebook"));
        $(".discord-login" ).click(() => API.redirectLogin("discord"));
        $(".google-login"  ).click(() => API.redirectLogin("google"));
        $("#logout-button" ).click(() => API.logout());

        $("#url-button").click(() => {
            let url = `${window.origin}/u/${API.userInfo.uid}/`;
            if (!this.copyToClipboard($("#copy").val(url).text(url)[0])) {
                this.console.log(`Failed to copy your bot URL to clipboard: ${url}`);
            } else {
                UIkit.notification({message: 'URL Copied', status: 'success', timeout: 3000 });
            }
        });

        let consoleElem = $("#console");

        const append = (...args) => {
            for (let arg of args) {
                log(arg);
                if (typeof arg === "object") {
                    if (arg.message && arg.stack) {
                        consoleElem.append(arg.message);
                    } else consoleElem.append(inspect(arg, false, 2, false));
                } else {
                    consoleElem.append(String(arg));
                }
            }
            consoleElem.append("<br>");
        };

        const b = t => `<strong>[<span class="${t}">${t.toUpperCase()}</span>]</strong> `;

        const { log, warn, error } = console;

        const fakeConsole = {
            log: (...args) => {
                consoleElem.append(b("log"));
                append(...args);
            },
            warn: (...args) => {
                consoleElem.append(b("warn"));
                append(...args);
            },
            error: (...args) => {
                consoleElem.append(b("error"));
                append(...args);
            }
        }

        this.console = fakeConsole;

        console.log   = this.console.log;
        console.warn  = this.console.warn;
        console.error = this.console.error;
    }

    copyToClipboard(element) {
        let range, selection;
      
        if (document.body.createTextRange) {
            range = document.body.createTextRange();
            range.moveToElementText(element);
            range.select();
        } else if (window.getSelection) {
            selection = window.getSelection();        
            range = document.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        try {
            document.execCommand('copy');
            return true;
        }
        catch (err) {
            return false;
        }
    }
    
    saveCode() {
        UIkit.notification({message: 'Code Saved', status: 'success', timeout: 3000 });
        localStorage.code = this.editor.getValue();
    }

    showLoginPanel() {
        $("#login-panel").show();
    }

    showUserPanel() {
        $("#user-panel").show();
        $("#username").text(API.name);
        $("#user-pfp").attr("src", API.avatarURL);
    }
}