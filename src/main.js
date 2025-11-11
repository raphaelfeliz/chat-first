import { get as getDomRefs } from './ui/domRefs.js';
import { init as initFirebase, getDb } from './messageSetup/firebase.js';
import { createChat, subscribe, addMessage } from './messageSetup/chat.js';
import { create as createUserMessageListener } from './messageHandling/userMessageListener.js';
import { appendBatch } from './messageHandling/generalMessageDisplayer.js';
import { bind as bindUserMessageHandler } from './messageHandling/userMessageHandler.js';

const { chatIdDisplay } = getDomRefs();

document.addEventListener("DOMContentLoaded", async () => {
  initFirebase();
  const db = getDb();
  if (!db) return; // Firebase init failed; bailout

  try {
    // Create a new chat session
    const { chatId } = await createChat();
    if (chatIdDisplay) chatIdDisplay.textContent = `Chat ID: ${chatId}`;

    // Prepare listener: only append new messages
    const listener = createUserMessageListener((newMessages) => {
      appendBatch(newMessages);
    });

    // Subscribe to this chat's messages
    subscribe(
      chatId,
      (messages) => {
        listener.onMessagesChanged(messages);
      },
      (err) => {
        if (chatIdDisplay) chatIdDisplay.textContent = "Error listening to chat.";
      }
    );

    // Bind the form handler for sending messages
    bindUserMessageHandler(chatId, addMessage);

  } catch (e) {
    console.error("Error starting chat:", e);
    if (chatIdDisplay) chatIdDisplay.textContent = "Error starting chat.";
  }
});
