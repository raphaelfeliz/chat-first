/*
path: src/chat/chatUi.js
purpose: Manages the chat user interface, handles user input, initiates the AI configuration flow, and renders messages.
summary: This file is responsible for all DOM interactions related to the chat panel. It handles the submission of user messages, appending them to the UI, and clearing the input. Crucially, it orchestrates the **AI-Powered Configuration Flow**: upon user submission, it retrieves the current configuration state, calls `getAiResponse` to talk to Gemini, displays a typing indicator during the wait, passes the structured AI response to `handleAiResponse` for state updates, and finally displays the AI's conversational message. It also manages the real-time message listener and rendering new facet questions as AI messages.
imports:
(import) escapeText: summary: Sanitizes text input to prevent XSS attacks before rendering in the DOM. (from ../utils/sanitizers.js)
(import) get: summary: Retrieves cached references to essential DOM elements. (from ../utils/domRefs.js)
(import) getAiResponse: summary: Sends the user's prompt and current state to the Gemini backend. (from ../services/gemini.js)
(import) handleAiResponse: summary: Translates the AI's structured JSON response into application state updates. (from ../state/orchestrator.js)
(import) getState: summary: Retrieves the current snapshot of the global application state. (from ../state/appState.js)
functions:
(private) createMessageElement: summary: Constructs the HTML DOM element for a single chat bubble (distinguishing between human and AI).
(private) scrollToBottom: summary: Scrolls the message container to the very bottom to show the latest message.
(export) appendBatch: summary: Takes an array of messages, creates their DOM elements, and appends them to the chat list, followed by a scroll to bottom.
(export) addAiMessageFromFacet: summary: Injects a configurator question (as a string) into the chat UI, formatted as an AI message.
(export) bindUserMessageHandler: summary: Attaches the 'submit' event listener to the chat form, implementing the full user message lifecycle (send, show indicator, call AI, update state, show AI reply).
(export) createUserMessageListener: summary: Returns an object with `onMessagesChanged` which is used by `main.js` to process new messages from the Firestore subscription without re-rendering the entire list.
(export) showTypingIndicator: summary: Renders and styles the animated 'typing...' indicator at the bottom of the chat list.
(export) hideTypingIndicator: summary: Removes the animated 'typing...' indicator from the chat list.
*/
import { escapeText } from '../utils/sanitizers.js';
import { get as getDomRefs } from '../utils/domRefs.js';
import { getAiResponse } from '../services/gemini.js';
import { handleAiResponse } from '../state/orchestrator.js';
import { getState } from '../state/appState.js';

const { messageList, chatForm, chatInput, bubbleArea } = getDomRefs();

function createMessageElement(message) {
    const container = document.createElement("div");
    const safeText = escapeText(message.text || "");

    if (message.userType === "human") {
        container.className = "flex justify-end";
        container.innerHTML = `
      <div class=\"bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg max-w-xs shadow\">
        <p class=\"text-sm\">${safeText}</p>
      </div>`;
    } else {
        container.className = "flex justify-start";
        container.innerHTML = `
      <div class=\"bg-gray-200 text-black p-3 rounded-r-lg rounded-bl-lg max-w-xs shadow-sm\">
        <p class=\"text-sm\">${safeText}</p>
      </div>`;
    }
    return container;
}

export function appendBatch(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return;
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'chatUi.js',
        step: 'appendBatch',
        message: 'Appending new message batch to UI.',
        payload: { messageCount: messages.length }
    }));
    const frag = document.createDocumentFragment();
    for (const m of messages) {
        frag.appendChild(createMessageElement(m));
    }
    messageList.appendChild(frag);
    scrollToBottom();
}

function scrollToBottom() {
    messageList.scrollTop = messageList.scrollHeight;
}

export function addAiMessageFromFacet(question) {
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'chatUi.js',
        step: 'addAiMessageFromFacet',
        message: 'Injecting new configurator question as an AI chat message.',
        payload: { questionSnippet: question.substring(0, 50) }
    }));
    const aiMessage = {
        userType: "ai",
        bubbleType: "chat-bubble",
        text: question,
        link: null,
        timestamp: new Date()
    };

    appendBatch([aiMessage]);
}

export function bindUserMessageHandler(chatId, addMessageFn) {
    if (!chatForm || !chatInput) {
        console.log(JSON.stringify({
            level: 'ERROR',
            source: 'chatUi.js',
            step: 'bindUserMessageHandler-fail',
            message: 'Chat form or input DOM elements not found. Handler binding aborted.'
        }));
        return;
    }

    chatForm.addEventListener("submit", async (evt) => {
        evt.preventDefault();
        const userInput = chatInput.value.trim();
        if (!userInput) return;

        const userMessage = {
            userType: "human",
            bubbleType: "chat-bubble",
            text: userInput,
            link: null,
            timestamp: new Date()
        };

        // 1. Send User Message to Firestore
        try {
            console.log(JSON.stringify({
                level: 'INFO',
                source: 'chatUi.js',
                step: 'addUserMessage-start',
                message: 'Dispatching user message to chatApi for persistence.',
                payload: { chatId, userInputLength: userInput.length }
            }));
            await addMessageFn(chatId, userMessage);
            chatInput.value = "";
        } catch (err) {
            console.log(JSON.stringify({
                level: 'ERROR',
                source: 'chatUi.js',
                step: 'addUserMessage-error',
                message: 'Failed to persist user message via chatApi.',
                payload: { error: err.message }
            }));
            return; // Don't proceed if user message fails to send
        }

        // 2. Show Typing Indicator
        showTypingIndicator();

        // 3. Call AI Service
        const currentState = getState();
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'chatUi.js',
            step: 'getAiResponse-call',
            message: 'Calling Gemini service with user input and current app state.',
            payload: { stateKeys: Object.keys(currentState) }
        }));
        const aiResponse = await getAiResponse(userInput, currentState);

        // 4. Hide Typing Indicator
        hideTypingIndicator();
        
        // 5. Update Application State
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'chatUi.js',
            step: 'handleAiResponse-dispatch',
            message: 'Dispatching AI structured response to orchestrator for state update.',
        }));
        handleAiResponse(aiResponse);

        // 6. Send AI Conversational Reply
        if (aiResponse && aiResponse.message) {
            const aiMessage = {
                userType: "ai",
                bubbleType: "chat-bubble",
                text: aiResponse.message,
                link: null,
                timestamp: new Date()
            };
            try {
                console.log(JSON.stringify({
                    level: 'INFO',
                    source: 'chatUi.js',
                    step: 'addAiMessage-start',
                    message: 'Dispatching AI conversational reply to chatApi for persistence.',
                }));
                await addMessageFn(chatId, aiMessage);
            } catch (err) {
                console.log(JSON.stringify({
                    level: 'ERROR',
                    source: 'chatUi.js',
                    step: 'addAiMessage-error',
                    message: 'Failed to persist AI message via chatApi.',
                    payload: { error: err.message }
                }));
            }
        } else {
            console.log(JSON.stringify({
                level: 'WARN',
                source: 'chatUi.js',
                step: 'addAiMessage-skip',
                message: 'Skipping AI reply: response was invalid, empty, or contained no message field.',
                payload: { response: aiResponse }
            }));
        }
    });
}

export function createUserMessageListener(onAppend) {
    let lastRenderedCount = 0;
    
    console.log(JSON.stringify({ 
        level: 'DEBUG', 
        source: 'chatUi.js', 
        step: 'createUserMessageListener-init',
        message: 'Message listener created with initial count 0.'
    }));

    function onMessagesChanged(messages) {
        if (!Array.isArray(messages)) return;
        
        console.log(JSON.stringify({ 
            level: 'DEBUG', 
            source: 'chatUi.js', 
            step: 'onMessagesChanged-check',
            payload: { currentCount: messages.length, lastRendered: lastRenderedCount }
        }));

        if (messages.length < lastRenderedCount) {
            // Case where chat history might have been cleared or reset
            lastRenderedCount = 0;
            console.log(JSON.stringify({ 
                level: 'WARN', 
                source: 'chatUi.js', 
                step: 'onMessagesChanged-reset',
                message: 'Message count decreased. Resetting lastRenderedCount to 0.',
            }));
        }

        if (messages.length > lastRenderedCount) {
            const newSlice = messages.slice(lastRenderedCount);
            console.log(JSON.stringify({ 
                level: 'INFO', 
                source: 'chatUi.js', 
                step: 'onMessagesChanged-render',
                message: 'New messages detected. Calling onAppend.',
                payload: { newMessagesCount: newSlice.length }
            }));
            onAppend(newSlice);
            lastRenderedCount = messages.length;
        }
    }

    return { onMessagesChanged };
}

let typingElement = null;

export function showTypingIndicator() {
    if (!bubbleArea) return;
    if (typingElement) return; // Already showing

    console.log(JSON.stringify({ 
        level: 'INFO', 
        source: 'chatUi.js', 
        step: 'showTypingIndicator-start',
        message: 'Rendering typing indicator.'
    }));

    typingElement = document.createElement("div");
    typingElement.className = "flex justify-start";
    typingElement.innerHTML = `
      <div class=\"bg-gray-200 text-black p-3 rounded-r-lg rounded-bl-lg max-w-xs shadow-sm\">
        <div class=\"typing-indicator\">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>`;
    
    // Injecting CSS for the animation dynamically
    const style = document.createElement('style');
    style.textContent = `
      .typing-indicator span {
        height: 8px; width: 8px; background-color: #9E9EA1; border-radius: 50%;
        display: inline-block; animation: bounce 1.3s infinite;
      }
      .typing-indicator span:nth-of-type(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-of-type(3) { animation-delay: 0.4s; }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
    `;
    typingElement.appendChild(style);
    messageList.appendChild(typingElement);
    scrollToBottom();
}

export function hideTypingIndicator() {
    if (!typingElement) return;
    console.log(JSON.stringify({ 
        level: 'INFO', 
        source: 'chatUi.js', 
        step: 'hideTypingIndicator-remove',
        message: 'Removing typing indicator.'
    }));
    typingElement.remove();
    typingElement = null;
}