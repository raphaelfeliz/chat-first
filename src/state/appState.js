/*
path: src/state/appState.js
purpose: Global state management for the application. It serves as the single source of truth for user data and product choices, handling data persistence and change notification.
*/
import { getDb } from '../config/firebase.js';

// 1. Private state object
const _state = {
    chatId: null,
    userData: {
        userName: null,
        userPhone: null,
        userEmail: null,
    },
    productChoice: {
        categoria: null,
        sistema: null,
        persiana: null,
        motorizada: null,
        material: null,
        folhas: null,
    },
};

// 2. Private list of subscribers
const _subscribers = [];

// 3. Private functions
async function _persistState() {
    if (!_state.chatId) {
        return;
    }

    const db = getDb();
    if (!db) {
        console.error('Firestore database is unavailable. Persistence operation aborted.');
        return;
    }

    const updatePayload = {
        userData: _state.userData,
        'product-choice': _state.productChoice, // Use kebab-case for Firestore
    };

    const docRef = db.collection("chats").doc(_state.chatId);

    try {
        await docRef.update(updatePayload);
    } catch (error) {
        console.error('Error persisting state to Firestore:', error);
    }
}

function _notifySubscribers() {
    const stateSnapshot = JSON.parse(JSON.stringify(_state));
    for (const callback of _subscribers) {
        try {
            callback(stateSnapshot);
        } catch (e) {
            console.error('Error executing a subscriber callback:', e);
        }
    }
}

// 4. Public API

export function getState() {
    return JSON.parse(JSON.stringify(_state));
}

export function subscribe(callback) {
    if (typeof callback !== 'function') {
        console.warn('Attempted to subscribe a non-function object. Subscription ignored.');
        return;
    }
    _subscribers.push(callback);
}

export async function updateProductChoice(newChoice) {
    const oldChoiceSnapshot = JSON.stringify(_state.productChoice);
    
    _state.productChoice = { ..._state.productChoice, ...newChoice };
    
    if(oldChoiceSnapshot !== JSON.stringify(_state.productChoice)) {
        _notifySubscribers();
        await _persistState();
    }
}

export async function updateUserData(newUserData) {
    const oldUserDataSnapshot = JSON.stringify(_state.userData);
    
    _state.userData = { ..._state.userData, ...newUserData };

    if (oldUserDataSnapshot !== JSON.stringify(_state.userData)) {
        _notifySubscribers();
        await _persistState();
    }
}

export async function resetProductChoice() {
    _state.productChoice = {
        categoria: null,
        sistema: null,
        persiana: null,
        motorizada: null,
        material: null,
        folhas: null,
    };
    _notifySubscribers();
    await _persistState();
}

/**
 * Initializes the entire app state from a Firestore document.
 */
export function initializeAppState(initialData) {
    if (!initialData || !initialData.id) {
        console.warn('Initialization failed: initialData is missing or has no ID. State will remain default.');
        return;
    }
    
    _state.chatId = initialData.id;
    
    if (initialData.userData) {
        _state.userData = { ..._state.userData, ...initialData.userData };
    }
    
    if (initialData['product-choice']) {
        _state.productChoice = { ..._state.productChoice, ...initialData['product-choice'] };
    }

    _notifySubscribers();
}