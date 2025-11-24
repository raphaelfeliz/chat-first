/*
path: src/chat/chatUi.js
purpose: Manages the chat user interface, handles user input, initiates the AI configuration flow, and renders messages.
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
        console.error('Chat form or input DOM elements not found. Handler binding aborted.');
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

        try {
            await addMessageFn(chatId, userMessage);
            chatInput.value = "";
        } catch (err) {
            console.error('Failed to persist user message via chatApi.', err);
            return; 
        }

        showTypingIndicator();

        const currentState = getState();
        const aiResponse = await getAiResponse(userInput, currentState);

        hideTypingIndicator();
        
        handleAiResponse(aiResponse);

        const newState = getState();

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
                    await addMessageFn(chatId, aiMessage);
                } catch (err) {
                    console.error('Failed to persist AI message via chatApi.', err);
                }
            } else {
                console.warn('Skipping AI reply: response was invalid, empty, or contained no message field.', { aiResponse });
            }
        }
    });
}

export function createUserMessageListener(onAppend) {
    let lastRenderedCount = 0;

    function onMessagesChanged(messages) {
        if (!Array.isArray(messages)) {
            console.warn('onMessagesChanged received non-array. Skipping.', { messagesType: typeof messages });
            return;
        }
        
        if (messages.length < lastRenderedCount) {
            console.warn('Message count decreased. Resetting lastRenderedCount to 0.', { currentCount: messages.length, lastRendered: lastRenderedCount });
            lastRenderedCount = 0;
        }

        if (messages.length > lastRenderedCount) {
            const newSlice = messages.slice(lastRenderedCount);
            onAppend(newSlice);
            lastRenderedCount = messages.length;
        }
    }

    return { onMessagesChanged };
}

let typingElement = null;

export function showTypingIndicator() {
    if (!bubbleArea || typingElement) return;

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
    typingElement.remove();
    typingElement = null;
}