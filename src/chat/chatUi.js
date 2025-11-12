import { escapeText } from '../utils/sanitizers.js';
import { get as getDomRefs } from '../utils/domRefs.js';
import { getAiResponse } from '../services/gemini.js';
import { handleAiResponse } from '../state/orchestrator.js'; // Import the orchestrator

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
    source: 'chatUi.js',
    step: 'appendBatch',
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

export function bindUserMessageHandler(chatId, addMessageFn) {
  if (!chatForm || !chatInput) return;

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
      console.log(JSON.stringify({ 
        source: 'chatUi.js', 
        step: 'addUserMessage', 
        payload: { chatId, message: userMessage }
      }));
      await addMessageFn(chatId, userMessage);
      chatInput.value = "";
    } catch (err) {
      console.error(JSON.stringify({ 
        source: 'chatUi.js', 
        step: 'addUserMessage-error', 
        payload: { error: err.message }
      }));
      return; // Don't proceed if user message fails to send
    }

    // --- AI Response Flow ---
    showTypingIndicator();

    const aiResponse = await getAiResponse(userInput);

    hideTypingIndicator();

    // --- State Update --- 
    // NEW: Pass the entire response to the orchestrator to handle state changes.
    handleAiResponse(aiResponse);

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
            source: 'chatUi.js', 
            step: 'addAiMessage', 
            payload: { chatId, message: aiMessage }
          }));
          await addMessageFn(chatId, aiMessage);
        } catch (err) {
          console.error(JSON.stringify({ 
            source: 'chatUi.js', 
            step: 'addAiMessage-error', 
            payload: { error: err.message }
          }));
        }
    } else {
        console.error(JSON.stringify({ 
            source: 'chatUi.js', 
            step: 'addAiMessage-error', 
            payload: { error: "Invalid or empty response from AI service", response: aiResponse }
          }));
    }
  });
}

export function createUserMessageListener(onAppend) {
  let lastRenderedCount = 0;

  function onMessagesChanged(messages) {
    if (!Array.isArray(messages)) return;

    if (messages.length < lastRenderedCount) {
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
  if (!bubbleArea) return;
  if (typingElement) return; // Already showing

  console.log(JSON.stringify({ source: 'chatUi.js', step: 'showTypingIndicator' }));

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
  console.log(JSON.stringify({ source: 'chatUi.js', step: 'hideTypingIndicator' }));
  typingElement.remove();
  typingElement = null;
}
