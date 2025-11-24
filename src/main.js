/*
path: src/main.js
purpose: Main entry point of the application. Initializes Firebase, the chat session, and the product configurator. It acts as the central orchestrator, managing initialization sequence and event wiring.
*/
import { init as initFirebase, getDb } from './config/firebase.js';
import { createChat, subscribe, addMessage } from './chat/chatApi.js';
import { appendBatch, bindUserMessageHandler, createUserMessageListener } from './chat/chatUi.js';
import { subscribe as subscribeToState, getState, updateUserData } from './state/appState.js';

// Create a simple event emitter
const events = {
    listeners: {},
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    emit(event, payload) {
        if (this.listeners[event] && this.listeners[event].length > 0) {
            this.listeners[event].forEach(callback => callback(payload));
        } else {
             console.warn(`Attempted to emit event '${event}' but no listeners were registered.`);
        }
    }
};

// ===============================================
// HANDOFF MANAGER
// ===============================================
let lastHandoffMessage = '';

function handleHandoffLogic(newState) {
    if (newState.userData.talkToHuman !== true) {
        if (lastHandoffMessage !== '') {
            lastHandoffMessage = '';
        }
        return;
    }

    const { userData, chatId, productChoice } = newState;
    let botQuestion = null;

    if (userData.userName === null || userData.userName === "") {
        botQuestion = "Com quem eu falo?";
    } else if ((userData.userPhone === null || userData.userPhone === "") && (userData.userEmail === null || userData.userEmail === "")) {
        botQuestion = "Vou passar você para um especialista. Qual seu telefone ou e-mail?";
    } else {
        const userName = userData.userName || "Cliente";
        const productValues = Object.values(productChoice).filter(val => val !== null && val !== "");
        
        let productString;
        if (productValues.length > 0) {
            productString = productValues.join('\n');
        } else {
            productString = "esquadrias sob medida";
        }

        const textMessage = `Olá, meu nome é ${userName},\nTenho interesse em:\n${productString}`;
        const encodedMessage = encodeURIComponent(textMessage);
        const link = `https://api.whatsapp.com/send?phone=5511976810216&text=${encodedMessage}`;
        
        const waMessage = {
            userType: 'ai',
            bubbleType: 'whatsapp-link',
            text: "Clique aqui para falar com um especialista.",
            link: link,
            timestamp: new Date()
        };

        addMessage(chatId, waMessage);
        updateUserData({ talkToHuman: false });
        lastHandoffMessage = '';
        return;
    }

    if (botQuestion && botQuestion !== lastHandoffMessage) {
        const questionMessage = {
            userType: 'ai',
            bubbleType: 'chat-bubble',
            text: botQuestion,
            timestamp: new Date()
        };
        addMessage(chatId, questionMessage);
        lastHandoffMessage = botQuestion;
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    initFirebase();
    const db = getDb();
    if (!db) {
        console.error('Firebase initialization failed. Application cannot proceed.');
        return;
    }

    try {
        const { chatId } = await createChat();

        const listener = createUserMessageListener((newMessages) => {
            appendBatch(newMessages);
        });

        subscribe(
            chatId,
            (messages) => {
                listener.onMessagesChanged(messages);
            },
            (err) => {
                console.error(`Error listening to chat changes for ID ${chatId}.`, err);
            }
        );

        bindUserMessageHandler(chatId, addMessage);

        events.on('facetQuestionUpdated', (questionText) => {
            if (questionText) {
                const aiMessage = {
                    userType: 'ai',
                    bubbleType: 'chat-bubble',
                    text: questionText,
                    link: null,
                    timestamp: new Date()
                };
                addMessage(chatId, aiMessage).catch(err => {
                    console.error("Failed to add AI facet question to chat via event.", err);
                });
            }
        });

    } catch (e) {
        console.error('Critical error during chat session initialization.', e);
    }

    import('./configurator/configuratorEngine.js').then(() => {
        if (window.ConfigEngine && window.ConfigEngine.init && window.ConfigEngine.render) {
            window.ConfigEngine.init(events);
            window.ConfigEngine.render(); // *** FIX: Trigger initial render ***
        } else {
            console.error('Configurator engine structure is incorrect (init or render not found).');
        }
    }).catch(error => {
        console.error('Failed to dynamically import configurator engine.', error);
    });

    subscribeToState(handleHandoffLogic);
});