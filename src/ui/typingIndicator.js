import { get as getDomRefs } from './domRefs.js';

let typingElement = null;

/**
 * Creates and shows a typing indicator in the chat.
 */
export function show() {
  const { bubbleArea } = getDomRefs();
  if (!bubbleArea) return;

  if (!typingElement) {
    typingElement = document.createElement("div");
    typingElement.classList.add("chat-bubble", "ai"); // Style it like an AI bubble
    typingElement.innerHTML = `
      <div class="typing-indicator">
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
export function hide() {
  if (typingElement && typingElement.parentNode) {
    typingElement.parentNode.removeChild(typingElement);
  }
  typingElement = null; // Reset for next time
}
