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
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'appState.js',
            step: '_persistState-skip',
            message: 'Skipping state persistence. Chat ID is not yet set (initial load).',
        }));
        return;
    }

    const db = getDb();
    if (!db) {
        console.log(JSON.stringify({
            level: 'ERROR',
            source: 'appState.js',
            step: '_persistState-fail',
            message: 'Firestore database is unavailable. Persistence operation aborted.',
        }));
        return;
    }

    const updatePayload = {
        userData: _state.userData,
        'product-choice': _state.productChoice, // Use kebab-case for Firestore
    };

    console.log(JSON.stringify({
        level: 'INFO',
        source: 'appState.js',
        step: '_persistState-start',
        message: 'Starting state persistence to Firestore.',
        payload: { chatId: _state.chatId, updateFields: Object.keys(updatePayload) }
    }));
    const docRef = db.collection("chats").doc(_state.chatId);

    try {
        await docRef.update(updatePayload);
        console.log(JSON.stringify({
            level: 'INFO',
            source: 'appState.js',
            step: '_persistState-success',
            message: 'State successfully persisted to Firestore.'
        }));
    } catch (error) {
        console.log(JSON.stringify({
            level: 'ERROR',
            source: 'appState.js',
            step: '_persistState-error',
            message: 'Error persisting state to Firestore.',
            payload: { error: error.message }
        }));
    }
}

function _notifySubscribers() {
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'appState.js',
        step: '_notifySubscribers-start',
        message: 'State change detected. Notifying all subscribers.',
        payload: { subscriberCount: _subscribers.length }
    }));
    const stateSnapshot = JSON.parse(JSON.stringify(_state));
    for (const callback of _subscribers) {
        try {
            callback(stateSnapshot);
        } catch (e) {
            console.log(JSON.stringify({
                level: 'ERROR',
                source: 'appState.js',
                step: '_notifySubscribers-error',
                message: 'Error executing a subscriber callback.',
                payload: { error: e.message }
            }));
        }
    }
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'appState.js',
        step: '_notifySubscribers-complete',
        message: 'All subscribers have been notified.'
    }));
}

// 4. Public API

export function getState() {
    const stateSnapshot = JSON.parse(JSON.stringify(_state));
    console.log(JSON.stringify({
        level: 'DEBUG',
        source: 'appState.js',
        step: 'getState',
        message: 'Returning deep cloned state snapshot to prevent mutation.'
    }));
    return stateSnapshot;
}

export function subscribe(callback) {
    if (typeof callback !== 'function') {
        console.log(JSON.stringify({
            level: 'WARN',
            source: 'appState.js',
            step: 'subscribe-fail',
            message: 'Attempted to subscribe a non-function object. Subscription ignored.',
        }));
        return;
    }
    _subscribers.push(callback);
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'appState.js',
        step: 'subscribe-success',
        message: 'New subscriber successfully added.',
        payload: { totalSubscribers: _subscribers.length }
    }));
}

export async function updateProductChoice(newChoice) {
    const oldChoiceSnapshot = JSON.stringify(_state.productChoice);
    
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'appState.js',
        step: 'updateProductChoice-start',
        message: 'Attempting to update product choice state.',
        payload: { newKeys: Object.keys(newChoice) }
    }));

    _state.productChoice = { ..._state.productChoice, ...newChoice };
    
    if(oldChoiceSnapshot !== JSON.stringify(_state.productChoice)) {
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'appState.js',
            step: 'updateProductChoice-change',
            message: 'Product choice state actually changed. Notifying and persisting.',
        }));
        _notifySubscribers();
        await _persistState();
    } else {
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'appState.js',
            step: 'updateProductChoice-no-change',
            message: 'Update resulted in no effective change. Skipping notification and persistence.',
        }));
    }
}

export async function updateUserData(newUserData) {
    const oldUserDataSnapshot = JSON.stringify(_state.userData);
    
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'appState.js',
        step: 'updateUserData-start',
        message: 'Attempting to update user data state.',
        payload: { newKeys: Object.keys(newUserData) }
    }));

    _state.userData = { ..._state.userData, ...newUserData };

    if (oldUserDataSnapshot !== JSON.stringify(_state.userData)) {
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'appState.js',
            step: 'updateUserData-change',
            message: 'User data state actually changed. Notifying and persisting.',
        }));
        _notifySubscribers();
        await _persistState();
    } else {
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'appState.js',
            step: 'updateUserData-no-change',
            message: 'Update resulted in no effective change. Skipping notification and persistence.',
        }));
    }
}

export async function resetProductChoice() {
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'appState.js',
        step: 'resetProductChoice-start',
        message: 'Resetting product choice to initial state.'
    }));
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
        console.log(JSON.stringify({
            level: 'WARN',
            source: 'appState.js',
            step: 'initializeAppState-fail',
            message: 'Initialization failed: initialData is missing or has no ID. State will remain default.',
        }));
        return;
    }
    
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'appState.js',
        step: 'initializeAppState-start',
        message: 'Hydrating app state from initial Firestore data.',
        payload: { chatId: initialData.id, initialDataKeys: Object.keys(initialData) }
    }));

    _state.chatId = initialData.id;
    
    if (initialData.userData) {
        _state.userData = { ..._state.userData, ...initialData.userData };
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'appState.js',
            step: 'initializeAppState-hydrate-user',
            message: 'User data section hydrated.'
        }));
    }
    
    if (initialData['product-choice']) {
        _state.productChoice = { ..._state.productChoice, ...initialData['product-choice'] };
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'appState.js',
            step: 'initializeAppState-hydrate-product',
            message: 'Product choice section hydrated.'
        }));
    }

    console.log(JSON.stringify({
        level: 'INFO',
        source: 'appState.js',
        step: 'initializeAppState-complete',
        message: 'State successfully hydrated. Notifying subscribers for initial UI render.'
    }));
    _notifySubscribers();
}