import { getDb, serverTimestamp, arrayUnion } from '../config/firebase.js';
import { initializeAppState } from '../state/appState.js';

export async function createChat() {
  const db = getDb();
  if (!db) throw new Error("Firestore not available");

  const chatId = Date.now().toString();
  const docRef = db.collection("chats").doc(chatId);

  const newChatData = {
    id: chatId,
    timestamp: serverTimestamp(),
    userData: {
      userName: null,
      userPhone: null,
      userEmail: null
    },
    messages: [
      {
        userType: "bot",
        bubbleType: "chat-bubble",
        text: "Olá, como eu posso ajudar?",
        link: null,
        timestamp: new Date()
      }
    ],
    "product-choice": {
      categoria: null,
      sistema: null,
      persiana: null,
      motorizada: null,
      material: null,
      folhas: null
    }
  };

  await docRef.set(newChatData);

  // Initialize the global state with the new chat's data
  initializeAppState(newChatData);

  return { chatId };
}

export function subscribe(chatId, onSnapshotMessages, onError) {
  const db = getDb();
  if (!db) throw new Error("Firestore not available");
  const docRef = db.collection("chats").doc(chatId);

  let isFirstSnapshot = true;

  return docRef.onSnapshot(
    (snap) => {
      if (!snap.exists) {
        console.error("Chat document not found:", chatId);
        return;
      }
      const data = { id: snap.id, ...snap.data() };

      // On the first snapshot for an existing chat, initialize the app state.
      if (isFirstSnapshot) {
        initializeAppState(data);
        isFirstSnapshot = false;
      }

      const messages = Array.isArray(data.messages) ? data.messages : [];
      onSnapshotMessages(messages);
    },
    (err) => {
      console.error("Error listening to chat document:", err);
      if (typeof onError === "function") onError(err);
    }
  );
}

export async function addMessage(chatId, message) {
  const db = getDb();
  if (!db) throw new Error("No chatId");
  if (!chatId) throw new Error("No chatId");

  const docRef = db.collection("chats").doc(chatId);
  await docRef.update({
    messages: arrayUnion(message)
  });
}
