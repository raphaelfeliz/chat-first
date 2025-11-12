import { escapeText } from '../utils/sanitizers.js';
import { get as getDomRefs } from '../utils/domRefs.js';

const { messageList, chatForm, chatInput, bubbleArea } = getDomRefs();

function createMessageElement(message) {
  const container = document.createElement("div");
  const safeText = escapeText(message.text || "");

  if (message.userType === "human") {
    // Right aligned, blue
    container.className = "flex justify-end";
    container.innerHTML = `
      <div class=\"bg-blue-600 text-white p-3 rounded-l-lg rounded-br-lg max-w-xs shadow\">
        <p class=\"text-sm\">${safeText}</p>
      </div>`;
  } else {
    // Left aligned, gray
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
    const raw = chatInput.value.trim();
    if (!raw) return;

    const message = {
      userType: "human",
      bubbleType: "chat-bubble",
      text: raw,          // Will be escaped at render time
      link: null,
      timestamp: new Date()
    };

    try {
      await addMessageFn(chatId, message);
      chatInput.value = "";
    } catch (err) {
      console.error("Error adding message:", err);
    }
  });
}

export function createUserMessageListener(onAppend) {
  let lastRenderedCount = 0;

  function onMessagesChanged(messages) {
    if (!Array.isArray(messages)) return;

    // If array shrank or reset, re-render from scratch by resetting the counter.
    if (messages.length < lastRenderedCount) {
      lastRenderedCount = 0;
    }

    // Append only the new slice.
    if (messages.length > lastRenderedCount) {
      const newSlice = messages.slice(lastRenderedCount);
      onAppend(newSlice);
      lastRenderedCount = messages.length;
    }
  }

  return { onMessagesChanged };
}

let typingElement = null;

/**
 * Creates and shows a typing indicator in the chat.
 */
export function showTypingIndicator() {
  if (!bubbleArea) return;

  if (!typingElement) {
    typingElement = document.createElement("div");
    typingElement.classList.add("chat-bubble", "ai"); // Style it like an AI bubble
    typingElement.innerHTML = `
      <div class=\"typing-indicator\">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
    // Add basic styling for the indicator
    const style = document.createElement('style');
    style.textContent = `
      .typing-indicator span {
        height: 8px;
        width: 8px;
        background-color: #9E9EA1;
        border-radius: 50%;
        display: inline-block;
        animation: bounce 1.3s infinite;
      }
      .typing-indicator span:nth-of-type(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-of-type(3) { animation-delay: 0.4s; }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-8px); }
      }
    `;
    typingElement.appendChild(style);
  }

  bubbleArea.appendChild(typingElement);
  bubbleArea.scrollTop = bubbleArea.scrollHeight;
}

/**
 * Hides the typing indicator.
 */
export function hideTypingIndicator() {
  if (typingElement && typingElement.parentNode) {
    typingElement.parentNode.removeChild(typingElement);
  }
  typingElement = null; // Reset for next time
}
