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
        this.editor.setValue(localStorage.code || StarterCode);

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
                    } else consoleElem.append(escapeHTML(inspect(arg, false, 2, false)));
                } else {
                    consoleElem.append(escapeHTML(String(arg)));
                }
            }
            consoleElem.append("<br>");
        };

        const b = t => `<strong>[<span class="${t}">${t.toUpperCase()}</span>]</strong> `;

        const { log, warn, error, clear } = console;

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
            },
            clear: () => consoleElem.html("")
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
        localStorage.code = (this.editor.getValue() || "").trim();
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
/** @param {string} html */
const escapeHTML = html => {
    return html.replace(/&/g,'&amp;')
               .replace(/</g,'&lt;')
               .replace(/>/g,'&gt;')
               .replace(/ /g, "&nbsp;")
               .replace(/\n/g, "<br>");
}

const StarterCode = "" +
`/* getState and getHistory is provided */
const state = getState();
const history = getHistory();

/* console.log, console.warn, console.error will
   write to Console panel on the right */
console.log("Game State: \n", JSON.stringify(state, null, 4));
console.warn(\`History Length: \${history.length}\`);

const players = state.players;
const me   = players[state.me];

const myCards = me.cards;

/* cardsToString is another useful method for debugging */
console.log("My cards: ", cardsToString(myCards));

let myBet = 0;

/* A simple algorithm */
let totalRank = 0;

/* rankToNumber: J->11,...,A->14, others remain same */
totalRank += rankToNumber(myCards[0].rank);
totalRank += rankToNumber(myCards[1].rank);

/* mra for Minium Raise Amount */
let mra = state.minimumRaiseAmount;

if (rank >= 24 && me.chips >= mra * 2)
    myBet = mra * 2;
  else if (rank >= 20 && me.chips >= mra * 1.5)
    myBet = mra * 1.5;
  else if (rank >= 16 && me.chips >= mra)
    myBet = mra;
    
/* Set bet amount to negative to leave */
if (me.chips >= me.buyIn * 1.5) 
    bet = -1;
else if (me.chips <= me.buyIn * 0.5)
    bet = -1;
    
/* Log the result */
console.log(myBet > 0 ? 
    \`Betting \${myBet} chips\` : "Leaving");
    
/* call function bet to send data back to server */
bet(myBet);
`;