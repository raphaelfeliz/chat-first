/*
path: src/main.js
purpose: Main entry point of the application. Initializes Firebase, the chat session, and the product configurator. It acts as the central orchestrator, managing initialization sequence and event wiring.
*/
const VERSION = '1.0.1';
const VERSION_NAME = 'Unification & Persistence';
console.log(JSON.stringify({
    level: 'INFO',
    source: 'main.js',
    step: 'APP_START',
    message: 'Application Initialization.',
    payload: { version: VERSION, versionName: VERSION_NAME }
}));

import { init as initFirebase, getDb } from './config/firebase.js';
import { createChat, subscribe, addMessage } from './chat/chatApi.js';
import { appendBatch, bindUserMessageHandler, createUserMessageListener, addAiMessageFromFacet } from './chat/chatUi.js';
import { subscribe as subscribeToState, getState, updateUserData } from './state/appState.js';

// Create a simple event emitter
const events = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'main.js',
            module: 'events',
            step: 'events.on',
            message: `Event listener registered for event: ${event}`,
            payload: { event, listenersCount: this.listeners[event].length }
        }));
    },
    emit(event, payload) {
        if (this.listeners[event]) {
            console.log(JSON.stringify({
                level: 'DEBUG',
                source: 'main.js',
                module: 'events',
                step: 'events.emit',
                message: `Emitting event: ${event}`,
                payload: { event, listenersCount: this.listeners[event].length, payloadKeys: Object.keys(payload || {}) }
            }));
            this.listeners[event].forEach(callback => callback(payload));
        } else {
             console.log(JSON.stringify({
                level: 'WARN',
                source: 'main.js',
                module: 'events',
                step: 'events.emit',
                message: `Attempted to emit event '${event}' but no listeners were registered.`,
                payload: { event }
            }));
        }
    }
};

// ===============================================
// HANDOFF MANAGER
// ===============================================
let lastHandoffMessage = '';

function handleHandoffLogic(newState) {
    console.groupCollapsed("🤝 Handoff Manager | State Change Detected");

    if (newState.userData.talkToHuman !== true) {
        console.log("🟢 Handoff Inactive. No action taken.");
        if (lastHandoffMessage !== '') {
            console.log("🔄 Resetting handoff tracker.");
            lastHandoffMessage = ''; // Reset tracker only when handoff state changes from active to inactive
        }
        console.groupEnd();
        return;
    }

    console.log("🚀 Handoff ACTIVE. Evaluating next step...");
    console.log("📦 Current State:", {
        userData: newState.userData,
        productChoice: newState.productChoice
    });

    const { userData, chatId, productChoice } = newState;
    let botQuestion = null;

    // --- Waterfall Logic: Determine the next question ---
    console.group("💧 Waterfall Logic");
    if (userData.userName === null || userData.userName === "") {
        console.log("Step 1: userName is missing.");
        botQuestion = "Com quem eu falo?";
    } else if ((userData.userPhone === null || userData.userPhone === "") && (userData.userEmail === null || userData.userEmail === "")) {
        console.log("Step 2: Contact info (phone/email) is missing.");
        botQuestion = "Vou passar você para um especialista. Qual seu telefone ou e-mail?";
    } else {
        console.log("✅ All data collected. Finalizing handoff.");
        console.groupEnd(); // End Waterfall Logic group

        console.group("🔗 Generating WhatsApp Link");
        const userName = userData.userName || "Cliente";
        
        // Filter out null/empty values from productChoice
        const productValues = Object.values(productChoice).filter(val => val !== null && val !== "");
        
        let productString;
        if (productValues.length > 0) {
            // Join with newline for the message text
            productString = productValues.join('\n');
        } else {
            productString = "esquadrias sob medida";
        }

        const textMessage = `Olá, meu nome é ${userName},\nTenho interesse em:\n${productString}`;
        const encodedMessage = encodeURIComponent(textMessage);
        const link = `https://api.whatsapp.com/send?phone=5511976810216&text=${encodedMessage}`;
        
        console.log("📝 Generated Message Text:\n", textMessage);
        console.log("🔗 Generated Full Link:", link);
        console.groupEnd();

        const waMessage = {
            userType: 'ai',
            bubbleType: 'whatsapp-link',
            text: "Clique aqui para falar com um especialista.",
            link: link,
            timestamp: new Date()
        };

        console.log("💬 Sending WhatsApp link message to UI...", waMessage);
        addMessage(chatId, waMessage);

        console.log("🔄 Resetting handoff state...");
        updateUserData({ talkToHuman: false });
        lastHandoffMessage = ''; // Clear the tracker
        console.groupEnd(); // End Handoff Manager group
        return;
    }
    console.groupEnd(); // End Waterfall Logic group

    // --- Ask Question Logic: Prevent re-asking the same question ---
    console.group("❓ Question Logic");
    if (botQuestion && botQuestion !== lastHandoffMessage) {
        const questionMessage = {
            userType: 'ai',
            bubbleType: 'chat-bubble',
            text: botQuestion,
            timestamp: new Date()
        };
        console.log(`💬 Sending new question to UI: "${botQuestion}"`, questionMessage);
        addMessage(chatId, questionMessage);
        lastHandoffMessage = botQuestion;
    } else if (botQuestion === lastHandoffMessage) {
        console.log("🟡 Waiting for user to answer the current question. Not re-asking.");
    } else {
        console.log("🟢 No new question to ask at this time.");
    }
    console.groupEnd(); // End Question Logic group

    console.groupEnd(); // End Handoff Manager group
}


console.log(JSON.stringify({
    level: 'INFO',
    source: 'main.js',
    step: 'SETUP',
    message: 'Attaching DOMContentLoaded listener for core bootstrapping.'
}));

document.addEventListener("DOMContentLoaded", async () => {
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'main.js',
        step: 'DOM_LOADED',
        message: 'DOMContentLoaded event fired. Beginning core initialization sequence.'
    }));

    console.log(JSON.stringify({
        level: 'INFO',
        source: 'main.js',
        step: 'FIREBASE_INIT',
        message: 'Attempting to initialize Firebase services.'
    }));
    initFirebase();
    const db = getDb();
    if (!db) {
        console.log(JSON.stringify({
            level: 'ERROR',
            source: 'main.js',
            step: 'FIREBASE_INIT_FAIL',
            message: 'Firebase initialization failed. Application cannot proceed.',
            payload: { error: 'Database service is null.' }
        }));
        return;
    }
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'main.js',
        step: 'FIREBASE_INIT_SUCCESS',
        message: 'Firebase initialized successfully. Database instance retrieved.'
    }));


    try {
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'main.js',
            step: 'CHAT_SESSION_CREATE',
            message: 'Attempting to create/restore chat session via chatApi.'
        }));
        const { chatId } = await createChat();
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'main.js',
            step: 'CHAT_SESSION_SUCCESS',
            message: 'Chat session successfully established.',
            payload: { chatId: chatId }
        }));

        const listener = createUserMessageListener((newMessages) => {
            console.log(JSON.stringify({
                level: 'DEBUG',
                source: 'main.js',
                module: 'chatUi',
                step: 'MESSAGE_BATCH_RENDER',
                message: 'Received new messages from listener. Appending to UI.',
                payload: { messageCount: newMessages.length }
            }));
            appendBatch(newMessages);
        });

        console.log(JSON.stringify({
            level: 'INFO',
            source: 'main.js',
            step: 'CHAT_SUBSCRIBE',
            message: 'Subscribing to real-time chat messages via chatApi.',
            payload: { chatId: chatId }
        }));
        subscribe(
            chatId,
            (messages) => {
                console.log(JSON.stringify({
                    level: 'DEBUG',
                    source: 'main.js',
                    module: 'chatApi',
                    step: 'FIRESTORE_CHANGE',
                    message: 'New chat snapshot received from Firestore.',
                    payload: { messageCount: messages.length }
                }));
                listener.onMessagesChanged(messages);
            },
            (err) => {
                console.log(JSON.stringify({
                    level: 'ERROR',
                    source: 'main.js',
                    step: 'CHAT_SUBSCRIBE_ERROR',
                    message: `Error listening to chat changes for ID ${chatId}.`,
                    payload: { error: err.message || 'Unknown error' }
                }));
            }
        );

        console.log(JSON.stringify({
            level: 'INFO',
            source: 'main.js',
            step: 'UI_HANDLER_BIND',
            message: 'Binding user input handler to chat UI.'
        }));
        bindUserMessageHandler(chatId, addMessage);
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'main.js',
            step: 'UI_HANDLER_BOUND',
            message: 'User message handler bound successfully to chatApi.addMessage.'
        }));

    } catch (e) {
        console.log(JSON.stringify({
            level: 'FATAL',
            source: 'main.js',
            step: 'CHAT_START_FAILURE',
            message: 'Critical error during chat session initialization.',
            payload: { error: e.message, stack: e.stack.split('\n')[1] }
        }));
    }

    // --- Configurator Engine Loading ---
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'main.js',
        step: 'ENGINE_LOAD',
        message: 'Dynamically importing configurator engine module.'
    }));
    import('./configurator/configuratorEngine.js').then(() => {
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'main.js',
            step: 'ENGINE_LOAD_SUCCESS',
            message: 'Configurator engine module loaded successfully.'
        }));
        if (window.ConfigEngine && window.ConfigEngine.init) {
            console.log(JSON.stringify({
                level: 'INFO',
                source: 'main.js',
                step: 'ENGINE_INIT_CALL',
                message: 'Calling ConfiguratorEngine.init() with event emitter.',
                payload: { emitter: 'defined' }
            }));
            window.ConfigEngine.init(events);
        } else {
            console.log(JSON.stringify({
                level: 'ERROR',
                source: 'main.js',
                step: 'ENGINE_INIT_FAIL',
                message: 'Configurator engine structure is incorrect (ConfigEngine.init not found).'
            }));
        }
    }).catch(error => {
        console.log(JSON.stringify({
            level: 'FATAL',
            source: 'main.js',
            step: 'ENGINE_IMPORT_FAIL',
            message: 'Failed to dynamically import configurator engine.',
            payload: { error: error.message }
        }));
    });

    // --- Event Listeners Setup ---
    events.on('facetQuestionUpdated', (question) => {
        // Suppress configurator questions during handoff
        if (getState().userData.talkToHuman === true) {
            console.warn("🤫 Suppressing 'facetQuestionUpdated' event: Handoff is active.");
            return;
        }
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'main.js',
            module: 'chatUi',
            step: 'event.facetQuestionUpdated',
            message: 'Received new facet question from ConfiguratorEngine. Injecting as AI message into chat UI.',
            payload: { question }
        }));
        addAiMessageFromFacet(question);
    });

    // --- SUBSCRIBE HANDOFF MANAGER ---
    subscribeToState(handleHandoffLogic);
    console.log("✅ Handoff Manager has been subscribed to state changes.");
    
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'main.js',
        step: 'BOOTSTRAP_COMPLETE',
        message: 'All core modules initialized. Awaiting user interaction.'
    }));
});