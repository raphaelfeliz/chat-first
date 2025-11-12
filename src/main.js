console.log('[main.js] Script starting...');

import { get as getDomRefs } from './ui/domRefs.js';
import { init as initFirebase, getDb } from './messageSetup/firebase.js';
import { createChat, subscribe, addMessage } from './messageSetup/chat.js';
import { create as createUserMessageListener } from './messageHandling/userMessageListener.js';
import { appendBatch } from './messageHandling/generalMessageDisplayer.js';
import { bind as bindUserMessageHandler } from './messageHandling/userMessageHandler.js';

console.log('[main.js] DOMContentLoaded listener attached.');
document.addEventListener("DOMContentLoaded", async () => {
  console.log('[main.js] DOMContentLoaded event fired.');

  console.log('[main.js] Initializing Firebase...');
  initFirebase();
  const db = getDb();
  if (!db) {
    console.error('[main.js] Firebase init failed; bailing out.');
    return;
  } 
  console.log('[main.js] Firebase initialized successfully.');


  try {
    console.log('[main.js] Creating new chat session...');
    const { chatId } = await createChat();
    console.log(`[main.js] Chat session created with ID: ${chatId}`);

    const listener = createUserMessageListener((newMessages) => {
      appendBatch(newMessages);
    });

    console.log(`[main.js] Subscribing to chat messages for chat ID: ${chatId}`);
    subscribe(
      chatId,
      (messages) => {
        listener.onMessagesChanged(messages);
      },
      (err) => {
        console.error(`[main.js] Error listening to chat for ID ${chatId}:`, err);
      }
    );

    console.log('[main.js] Binding user message handler...');
    bindUserMessageHandler(chatId, addMessage);
    console.log('[main.js] User message handler bound.');

  } catch (e) {
    console.error("[main.js] Error starting chat:", e);
  }

  console.log('[main.js] Loading configurator engine...');
  import('./core/engine/configuratorEngine.js').then(() => {
    console.log('[main.js] Configurator engine loaded successfully.');
  }).catch(error => {
    console.error('[main.js] Failed to load configurator engine:', error);
  });
});
