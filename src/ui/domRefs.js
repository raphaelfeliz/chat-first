let _cache = null;

export function get() {
  if (_cache) return _cache;
  _cache = {
    chatForm: document.getElementById("input-area"),
    chatInput: document.getElementById("chat-input"),
    messageList: document.getElementById("bubble-area"),
    chatIdDisplay: document.getElementById("chat-id-display"),
  };
  return _cache;
}