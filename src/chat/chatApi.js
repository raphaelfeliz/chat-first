/*
path: src/chat/chatApi.js
purpose: Provides the interface for interacting with the Firebase Firestore database to manage chat sessions and messages.
summary: This module abstracts all Firestore operations related to the chat. It handles creating a new chat session (`createChat`), which initializes the document with default product configuration and a welcome message, and also hydrates the global `appState`. It manages real-time message synchronization through `subscribe` (using Firestore's `onSnapshot`), which is responsible for initializing the global state upon the first load of an *existing* chat. Finally, it provides `addMessage` to append new messages to the chat history using Firestore's `arrayUnion` to ensure atomic updates.
imports:
(import) getDb: summary: Retrieves the initialized Firestore database instance. (from ../config/firebase.js)
(import) serverTimestamp: summary: A Firestore field value that automatically populates the server time upon document creation/update. (from ../config/firebase.js)
(import) arrayUnion: summary: A Firestore field value that atomically adds elements to an array field without duplicates. (from ../config/firebase.js)
(import) initializeAppState: summary: Hydrates the global application state object with initial/loaded data. (from ../state/appState.js)
functions:
(export) createChat: summary: Creates a new chat document in Firestore, populating it with default data and a welcome message. It then initializes the global `appState` with this new data.
(export) subscribe: summary: Establishes a real-time listener (onSnapshot) on a specific chat document. It handles initializing the global state if it's the first snapshot of an existing chat, and passes the updated list of messages to the provided callback (`onSnapshotMessages`).
(export) addMessage: summary: Atomically appends a new message object to the `messages` array field within the chat document using `arrayUnion`.
*/
import { getDb, serverTimestamp, arrayUnion } from '../config/firebase.js';
import { initializeAppState } from '../state/appState.js';

export async function createChat() {
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'chatApi.js',
        context: { function: 'createChat', process: 'SESSION_MGMT' },
        step: 'start',
        message: 'Attempting to create a new chat session document.'
    }));
    const db = getDb();
    if (!db) {
        console.log(JSON.stringify({
            level: 'FATAL',
            source: 'chatApi.js',
            context: { function: 'createChat' },
            step: 'fail',
            message: 'Firestore not available. Cannot create chat.',
        }));
        throw new Error("Firestore not available");
    }

    // Use a timestamp-based ID for simplicity
    const chatId = Date.now().toString();
    const docRef = db.collection("chats").doc(chatId);
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'chatApi.js',
        context: { function: 'createChat' },
        step: 'process',
        message: 'Generated new chat ID and Firestore document reference.',
        payload: { chatId, collection: 'chats' }
    }));

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
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'chatApi.js',
        context: { function: 'createChat' },
        step: 'process',
        message: 'Created new chat data object for persistence.',
        payload: { chatId, initialMessage: newChatData.messages[0].text, stateKeys: Object.keys(newChatData) }
    }));

    try {
        await docRef.set(newChatData);
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'chatApi.js',
            context: { function: 'createChat' },
            step: 'persist-success',
            message: 'New chat document successfully created in Firestore.',
            payload: { chatId }
        }));

        // Initialize the global state with the new chat's data
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'chatApi.js',
            context: { function: 'createChat' },
            step: 'process',
            message: 'Dispatching to appState.initializeAppState to hydrate global state.'
        }));
        initializeAppState(newChatData);

        console.log(JSON.stringify({
            level: 'INFO',
            source: 'chatApi.js',
            context: { function: 'createChat', process: 'SESSION_MGMT' },
            step: 'end',
            message: 'Chat creation and state hydration successful.',
            payload: { chatId }
        }));
        return { chatId };
    } catch (e) {
        console.log(JSON.stringify({
            level: 'FATAL',
            source: 'chatApi.js',
            context: { function: 'createChat' },
            step: 'error',
            message: 'Error creating chat document.',
            payload: { error: e.message, stack: e.stack }
        }));
        throw e;
    }
}

export function subscribe(chatId, onSnapshotMessages, onError) {
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'chatApi.js',
        context: { function: 'subscribe', process: 'REALTIME_SYNC' },
        step: 'start',
        message: 'Establishing real-time Firestore listener for chat.',
        payload: { chatId }
    }));
    const db = getDb();
    if (!db) {
        console.log(JSON.stringify({
            level: 'FATAL',
            source: 'chatApi.js',
            context: { function: 'subscribe' },
            step: 'fail',
            message: 'Firestore not available. Cannot subscribe.',
        }));
        throw new Error("Firestore not available");
    }
    const docRef = db.collection("chats").doc(chatId);

    let isFirstSnapshot = true;

    return docRef.onSnapshot(
        (snap) => {
            if (!snap.exists) {
                console.log(JSON.stringify({
                    level: 'ERROR',
                    source: 'chatApi.js',
                    context: { function: 'subscribe', process: 'REALTIME_SYNC' },
                    step: 'error-no-doc',
                    message: 'Chat document not found on subscription snapshot.',
                    payload: { chatId }
                }));
                return;
            }
            const data = { id: snap.id, ...snap.data() };
            const messages = Array.isArray(data.messages) ? data.messages : [];
            
            console.log(JSON.stringify({
                level: 'DEBUG',
                source: 'chatApi.js',
                context: { function: 'subscribe', process: 'REALTIME_SYNC' },
                step: 'snapshot-received',
                message: 'New chat document snapshot received.',
                payload: { isFirstSnapshot, messagesCount: messages.length, chatId }
            }));

            // On the first snapshot for an existing chat, initialize the app state.
            if (isFirstSnapshot) {
                console.log(JSON.stringify({
                    level: 'INFO',
                    source: 'chatApi.js',
                    context: { function: 'subscribe' },
                    step: 'process',
                    message: 'First snapshot. Dispatching to appState.initializeAppState to hydrate.'
                }));
                initializeAppState(data);
                isFirstSnapshot = false;
                console.log(JSON.stringify({
                    level: 'INFO',
                    source: 'chatApi.js',
                    context: { function: 'subscribe' },
                    step: 'process',
                    message: 'Existing chat state hydrated from first snapshot.',
                }));
            }

            console.log(JSON.stringify({
                level: 'DEBUG',
                source: 'chatApi.js',
                context: { function: 'subscribe' },
                step: 'process',
                message: 'Executing onSnapshotMessages callback with new message list.',
                payload: { messagesCount: messages.length }
            }));
            onSnapshotMessages(messages);
        },
        (err) => {
            console.log(JSON.stringify({
                level: 'ERROR',
                source: 'chatApi.js',
                context: { function: 'subscribe', process: 'REALTIME_SYNC' },
                step: 'error',
                message: 'Error listening to chat document.',
                payload: { error: err.message, stack: err.stack, chatId }
            }));
            if (typeof onError === "function") onError(err);
        }
    );
}

export async function addMessage(chatId, message) {
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'chatApi.js',
        context: { function: 'addMessage', process: 'DB_WRITE' },
        step: 'start',
        message: 'Attempting to append new message to chat history.',
        payload: { chatId, userType: message.userType, messageTextSnippet: (message.text ? message.text.substring(0, 30) + '...' : 'N/A') }
    }));
    const db = getDb();
    if (!db) {
        console.log(JSON.stringify({
            level: 'FATAL',
            source: 'chatApi.js',
            context: { function: 'addMessage' },
            step: 'fail',
            message: 'Firestore not available.',
        }));
        throw new Error("Firestore not available");
    }
    if (!chatId) {
         console.log(JSON.stringify({
            level: 'ERROR',
            source: 'chatApi.js',
            context: { function: 'addMessage' },
            step: 'fail-no-chatid',
            message: 'No Chat ID provided. Cannot add message.',
        }));
        throw new Error("No chatId");
    }

    const docRef = db.collection("chats").doc(chatId);
    try {
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'chatApi.js',
            context: { function: 'addMessage' },
            step: 'process',
            message: 'Calling docRef.update with arrayUnion.'
        }));
        await docRef.update({
            messages: arrayUnion(message)
        });
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'chatApi.js',
            context: { function: 'addMessage', process: 'DB_WRITE' },
            step: 'success',
            message: 'Message successfully appended to Firestore array.',
        }));
    } catch (e) {
         console.log(JSON.stringify({
            level: 'ERROR',
            source: 'chatApi.js',
            context: { function: 'addMessage' },
            step: 'error',
            message: 'Error updating chat document with new message.',
            payload: { error: e.message, stack: e.stack, chatId }
        }));
        throw e;
    }
}