import { ChatGPTWebBot } from '../app'
import { ChatError } from '~utils/errors'

console.log('background is running')

let portFromCS: chrome.runtime.Port;

// Connection handler for runtime.connect
chrome.runtime.onConnect.addListener((port) => {
    console.log("Connected to content script:", port.name);

    portFromCS = port;
});

// Listen to Omnibox input
chrome.omnibox.onInputEntered.addListener(async (text) => {
  console.log("Omnibox input:", text);
  const abortController = new AbortController()
  const resp = await new ChatGPTWebBot().sendMessage({
    prompt: text,
    signal: abortController.signal,
  })

  try {
    for await (const answer of resp) {
      console.log(answer);
      portFromCS.postMessage({ type: "apiResponse", data: answer });
    }
  } catch (err: unknown) {
    if (!abortController.signal.aborted) {
      abortController.abort()
    }
    const error = err as ChatError
    console.error('sendMessage error', error.code, error)
  }
  //await askQuestion(text, portFromCS);
  //portFromCS.postMessage({ type: "apiResponse", data: text });
});

