import { escapeText } from '../utils/sanitizers.js';
import { get as getDomRefs } from '../ui/domRefs.js';

const { messageList } = getDomRefs();

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
