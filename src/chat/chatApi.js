/*
path: src/chat/chatApi.js
purpose: Provides the interface for interacting with the Firebase Firestore database to manage chat sessions and messages.
*/
import { getDb, serverTimestamp, arrayUnion } from '../config/firebase.js';
import { initializeAppState } from '../state/appState.js';

export async function createChat() {
    const db = getDb();
    if (!db) {
        console.error("Firestore not available. Cannot create chat.");
        throw new Error("Firestore not available");
    }

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

    try {
        await docRef.set(newChatData);
        initializeAppState(newChatData);
        return { chatId };
    } catch (e) {
        console.error("Error creating chat document.", e);
        throw e;
    }
}

export function subscribe(chatId, onSnapshotMessages, onError) {
    const db = getDb();
    if (!db) {
        console.error("Firestore not available. Cannot subscribe.");
        throw new Error("Firestore not available");
    }
    const docRef = db.collection("chats").doc(chatId);

    let isFirstSnapshot = true;

    return docRef.onSnapshot(
        (snap) => {
            if (!snap.exists) {
                console.error("Chat document not found on subscription snapshot.", { chatId });
                return;
            }
            const data = { id: snap.id, ...snap.data() };
            const messages = Array.isArray(data.messages) ? data.messages : [];
            
            if (isFirstSnapshot) {
                initializeAppState(data);
                isFirstSnapshot = false;
            }

            onSnapshotMessages(messages);
        },
        (err) => {
            console.error("Error listening to chat document.", err);
            if (typeof onError === "function") onError(err);
        }
    );
}

export async function addMessage(chatId, message) {
    const db = getDb();
    if (!db) {
        console.error("Firestore not available.");
        throw new Error("Firestore not available");
    }
    if (!chatId) {
         console.error("No Chat ID provided. Cannot add message.");
        throw new Error("No chatId");
    }

    const docRef = db.collection("chats").doc(chatId);
    try {
        await docRef.update({
            messages: arrayUnion(message)
        });
    } catch (e) {
         console.error("Error updating chat document with new message.", e);
        throw e;
    }
}