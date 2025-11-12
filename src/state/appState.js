/*
path: src/state/appState.js
purpose: Global state management for the application. It serves as the single source of truth for user data and product choices, handling data persistence and change notification.
summary: This module uses a private object (`_state`) to hold the current application state (chat ID, user contact info, and product configuration). It implements a simple Publish/Subscribe (`_subscribers`) pattern to notify other modules (like the Configurator Engine) whenever the state changes. All state changes trigger an asynchronous update to a Firestore document via `_persistState()`, ensuring session data is saved in real-time. It provides exported functions for read-only access (`getState`), subscription (`subscribe`), and controlled updates (`updateProductChoice`, `updateUserData`).
imports:
(import) getDb: summary: Retrieves the initialized Firestore database instance for persistence operations. (from ../config/firebase.js)
functions:
(private) _persistState: summary: Asynchronously updates the user's chat document in Firebase Firestore with the current `userData` and `productChoice` fields.
(private) _notifySubscribers: summary: Iterates over all registered callbacks in `_subscribers` and executes them, passing a deep clone of the current state.
(export) getState: summary: Returns a deep clone (snapshot) of the entire application state object.
(export) subscribe: summary: Adds a new function to the list of listeners that are executed upon a state change.
(export) updateProductChoice: summary: Merges new product attributes into the current product choice state, then notifies subscribers and persists the state, but only if an actual change occurred.
(export) updateUserData: summary: Merges new user data into the current user data state, then notifies subscribers and persists the state, but only if an actual change occurred.
(export) initializeAppState: summary: The entry point for restoring an existing session. It hydrates the private state object with data loaded from Firestore and immediately notifies all subscribers to render the UI.
*/
/**
 * @fileoverview Global state management for the application.
 * Manages both user data and product choices, providing a single source of truth.
 * Implements a publish/subscribe pattern to notify other modules of state changes.
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

/**
 * Initializes the entire app state from a Firestore document.
 * This is the primary entry point for hydrating the state on page load.
 * Crucially, it notifies all subscribers after the state is set,
 * allowing the UI to render with the loaded data.
 * @param {object} initialData - The complete data object from Firestore, including its ID.
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
    
    // Handle the kebab-case from firestore
    if (initialData['product-choice']) {
        _state.productChoice = { ..._state.productChoice, ...initialData['product-choice'] };
        console.log(JSON.stringify({
            level: 'DEBUG',
            source: 'appState.js',
            step: 'initializeAppState-hydrate-product',
            message: 'Product choice section hydrated.'
        }));
    }

    // Notify subscribers to update the UI with the loaded state.
    console.log(JSON.stringify({
        level: 'INFO',
        source: 'appState.js',
        step: 'initializeAppState-complete',
        message: 'State successfully hydrated. Notifying subscribers for initial UI render.'
    }));
    _notifySubscribers();
}