console.info('contentScript is running')

function copyTextToClipboard(text: string) {
    //Create a textbox field where we can insert text to. 
    var copyFrom = document.createElement("textarea");

    //Set the text content to be the text you wished to copy.
    copyFrom.textContent = text;

    //Append the textbox field into the body as a child. 
    //"execCommand()" only works when there exists selected text, and the text is inside 
    //document.body (meaning the text is part of a valid rendered HTML element).
    document.body.appendChild(copyFrom);

    //Select all the text!
    copyFrom.select();

    //Execute command
    document.execCommand('copy');

    //(Optional) De-select the text using blur(). 
    copyFrom.blur();

    //Remove the textbox field from the document.body, so no other JavaScript nor 
    //other elements can get access to this.
    document.body.removeChild(copyFrom);
}

function connectToBackground() {
    const port = chrome.runtime.connect({ name: "omnibox-port" });

    port.onMessage.addListener((message) => {
        console.log(message);
        if (message.type === "apiResponse") {
            console.log("API Response received in content.js:", message);
            const text = message.data.replace(/ /g, "_");
            //history.replaceState(null, null, text);
            copyTextToClipboard(text)
        } else if (message.type === "error") {
            console.error("Error received in content.js:", message.error);
        }
    });

    port.onDisconnect.addListener(() => {
        console.warn("Port disconnected. Reconnecting...");
        setTimeout(connectToBackground, 1000); // 再接続
    });
}

// 初回接続
connectToBackground();