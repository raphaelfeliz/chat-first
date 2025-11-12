/*
path: src/chat/chatUi.js
purpose: Manages the chat user interface, handles user input, initiates the AI configuration flow, and renders messages.
summary: This file is responsible for all DOM interactions related to the chat panel. It handles the submission of user messages, appending them to the UI, and clearing the input. Crucially, it orchestrates the **AI-Powered Configuration Flow**: upon user submission, it retrieves the current configuration state, calls `getAiResponse` to talk to Gemini, displays a typing indicator during the wait, passes the structured AI response to `handleAiResponse` for state updates, and finally displays the AI's conversational message. It also manages the real-time message listener and rendering new facet questions as AI messages.
*/
import { escapeText } from '../utils/sanitizers.js';
import { get as getDomRefs } from '../utils/domRefs.js';
import { getAiResponse } from '../services/gemini.js';
import { handleAiResponse } from '../state/orchestrator.js';
import { getState } from '../state/appState.js';

const { messageList, chatForm, chatInput, bubbleArea } = getDomRefs();

function createMessageElement(message) {
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'chatUi.js',
        context: { function: 'createMessageElement', process: 'UI_RENDER' },
        step: 'process',
        message: 'Creating message element.',
        payload: { userType: message.userType, bubbleType: message.bubbleType }
    }));
    const container = document.createElement("div");
    const safeText = escapeText(message.text || "");

    if (message.userType === "human") {
        container.className = "flex justify-end";
        container.innerHTML = `
      <div class="bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg max-w-xs shadow">
        <p class="text-sm">${safeText}</p>
      </div>`;
    } else if (message.bubbleType === 'whatsapp-link') {
        container.className = "flex justify-start";
        const safeLink = escapeText(message.link || "#");
        container.innerHTML = `
          <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="whatsapp-bubble">
            <p>${safeText}</p>
          </a>`;
    } else {
        container.className = "flex justify-start";
        container.innerHTML = `
      <div class="bg-gray-200 text-black p-3 rounded-r-lg rounded-bl-lg max-w-xs shadow-sm">
        <p class="text-sm">${safeText}</p>
      </div>`;
    }
    return container;
}

export function appendBatch(messages) {
    if (!Array.isArray(messages) || messages.length === 0) return;
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'chatUi.js',
        context: { function: 'appendBatch', process: 'UI_RENDER' },
        step: 'start',
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
        context: { function: 'addAiMessageFromFacet', process: 'CONFIG_TO_CHAT_SYNC' },
        step: 'start',
        message: 'Injecting new configurator question as an AI chat message.',
        payload: { questionSnippet: question.substring(0, 50) + '...' }
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
            context: { function: 'bindUserMessageHandler', process: 'INIT' },
            step: 'fail',
            message: 'Chat form or input DOM elements not found. Handler binding aborted.'
        }));
        return;
    }

    chatForm.addEventListener("submit", async (evt) => {
        evt.preventDefault();
        const userInput = chatInput.value.trim();
        if (!userInput) return;

        console.log(JSON.stringify({
            level: 'INFO',
            source: 'chatUi.js',
            context: { function: 'bindUserMessageHandler (submit)', process: 'AI_FLOW' },
            step: 'start',
            message: 'User message submitted. Starting AI flow.',
            payload: { userInputSnippet: userInput.substring(0, 30) + '...' }
        }));

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
                context: { function: 'bindUserMessageHandler (submit)', process: 'DB_WRITE' },
                step: 'process',
                message: 'Dispatching user message to chatApi for persistence.',
                payload: { chatId, userInputLength: userInput.length }
            }));
            await addMessageFn(chatId, userMessage);
            chatInput.value = "";
        } catch (err) {
            console.log(JSON.stringify({
                level: 'ERROR',
                source: 'chatUi.js',
                context: { function: 'bindUserMessageHandler (submit)', process: 'DB_WRITE' },
                step: 'fail',
                message: 'Failed to persist user message via chatApi.',
                payload: { error: err.message, stack: err.stack }
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
            context: { function: 'bindUserMessageHandler (submit)', process: 'AI_FLOW' },
            step: 'process',
            message: 'Calling Gemini service (getAiResponse) with user input and current app state.',
            payload: { stateKeys: Object.keys(currentState), stateProductChoice: currentState.productChoice }
        }));
        const aiResponse = await getAiResponse(userInput, currentState);

        // 4. Hide Typing Indicator
        hideTypingIndicator();
        
        // 5. Update Application State
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'chatUi.js',
            context: { function: 'bindUserMessageHandler (submit)', process: 'STATE_MGMT' },
            step: 'process',
            message: 'Dispatching AI structured response to orchestrator (handleAiResponse).',
            payload: { aiResponseStatus: aiResponse.status, aiResponseTarget: aiResponse.data?.target }
        }));
        handleAiResponse(aiResponse);

        // 6. Send AI Conversational Reply (if not in handoff)
        const newState = getState(); // Get the *new* state post-orchestration
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'chatUi.js',
            context: { function: 'bindUserMessageHandler (submit)', process: 'AI_FLOW' },
            step: 'check',
            message: 'Checking handoff status before posting AI reply.',
            payload: { talkToHuman: newState.userData.talkToHuman }
        }));

        if (newState.userData.talkToHuman !== true) {
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
                        context: { function: 'bindUserMessageHandler (submit)', process: 'DB_WRITE' },
                        step: 'process',
                        message: 'Dispatching AI conversational reply to chatApi for persistence.',
                        payload: { messageSnippet: aiMessage.text.substring(0, 50) + '...' }
                    }));
                    await addMessageFn(chatId, aiMessage);
                } catch (err) {
                    console.log(JSON.stringify({
                        level: 'ERROR',
                        source: 'chatUi.js',
                        context: { function: 'bindUserMessageHandler (submit)', process: 'DB_WRITE' },
                        step: 'fail',
                        message: 'Failed to persist AI message via chatApi.',
                        payload: { error: err.message, stack: err.stack }
                    }));
                }
            } else {
                console.log(JSON.stringify({
                    level: 'WARN',
                    source: 'chatUi.js',
                    context: { function: 'bindUserMessageHandler (submit)', process: 'AI_FLOW' },
                    step: 'warn',
                    message: 'Skipping AI reply: response was invalid, empty, or contained no message field.',
                    payload: { aiResponse }
                }));
            }
        } else {
            console.log(JSON.stringify({
                level: 'INFO',
                source: 'chatUi.js',
                context: { function: 'bindUserMessageHandler (submit)', process: 'AI_FLOW' },
                step: 'skip',
                message: 'Handoff to human is active. Suppressing AI conversational reply.'
            }));
        }
        
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'chatUi.js',
            context: { function: 'bindUserMessageHandler (submit)', process: 'AI_FLOW' },
            step: 'end',
            message: 'User message submit flow complete.',
        }));
    });
}

export function createUserMessageListener(onAppend) {
    let lastRenderedCount = 0;
    
    console.log(JSON.stringify({ 
        level: 'DEBUG', 
        source: 'chatUi.js', 
        context: { function: 'createUserMessageListener', process: 'REALTIME_SYNC' },
        step: 'init',
        message: 'Message listener created with initial count 0.'
    }));

    function onMessagesChanged(messages) {
        if (!Array.isArray(messages)) {
             console.log(JSON.stringify({ 
                level: 'WARN', 
                source: 'chatUi.js', 
                context: { function: 'onMessagesChanged' },
                step: 'warn',
                message: 'onMessagesChanged received non-array. Skipping.',
                payload: { messagesType: typeof messages }
            }));
            return;
        }
        
        console.log(JSON.stringify({ 
            level: 'DEBUG', 
            source: 'chatUi.js', 
            context: { function: 'onMessagesChanged', process: 'REALTIME_SYNC' },
            step: 'check',
            message: 'Checking message count for changes.',
            payload: { currentCount: messages.length, lastRendered: lastRenderedCount }
        }));

        if (messages.length < lastRenderedCount) {
            // Case where chat history might have been cleared or reset
            console.log(JSON.stringify({ 
                level: 'WARN', 
                source: 'chatUi.js', 
                context: { function: 'onMessagesChanged', process: 'REALTIME_SYNC' },
                step: 'warn',
                message: 'Message count decreased. Resetting lastRenderedCount to 0.',
                payload: { currentCount: messages.length, lastRendered: lastRenderedCount }
            }));
            lastRenderedCount = 0;
        }

        if (messages.length > lastRenderedCount) {
            const newSlice = messages.slice(lastRenderedCount);
            console.log(JSON.stringify({ 
                level: 'INFO', 
                source: 'chatUi.js', 
                context: { function: 'onMessagesChanged', process: 'UI_RENDER' },
                step: 'process',
                message: 'New messages detected. Calling onAppend.',
                payload: { newMessagesCount: newSlice.length, totalMessages: messages.length }
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
    if (typingElement) {
        console.log(JSON.stringify({ 
            level: 'DEBUG', 
            source: 'chatUi.js', 
            context: { function: 'showTypingIndicator', process: 'UI_RENDER' },
            step: 'skip',
            message: 'Typing indicator already visible. Skipping.'
        }));
        return; // Already showing
    }

    console.log(JSON.stringify({ 
        level: 'INFO', 
        source: 'chatUi.js', 
        context: { function: 'showTypingIndicator', process: 'UI_RENDER' },
        step: 'start',
        message: 'Rendering typing indicator.'
    }));

    typingElement = document.createElement("div");
    typingElement.className = "flex justify-start";
    typingElement.innerHTML = `
      <div class="bg-gray-200 text-black p-3 rounded-r-lg rounded-bl-lg max-w-xs shadow-sm">
        <div class="typing-indicator">
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
    if (!typingElement) {
        console.log(JSON.stringify({ 
            level: 'DEBUG', 
            source: 'chatUi.js', 
            context: { function: 'hideTypingIndicator', process: 'UI_RENDER' },
            step: 'skip',
            message: 'Typing indicator not visible. Skipping removal.'
        }));
        return; // Not showing
    }
    console.log(JSON.stringify({ 
        level: 'INFO', 
        source: 'chatUi.js', 
        context: { function: 'hideTypingIndicator', process: 'UI_RENDER' },
        step: 'process',
        message: 'Removing typing indicator.'
    }));
    typingElement.remove();
    typingElement = null;
}