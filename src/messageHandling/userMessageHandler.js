import { get as getDomRefs } from '../ui/domRefs.js';

const { chatForm, chatInput } = getDomRefs();

export function bind(chatId, addMessageFn) {
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
