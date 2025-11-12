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
    // This is expected on initial load before a chat is created.
    return;
  }

  const db = getDb();
  if (!db) {
    console.error("[appState] Firestore is not available, cannot persist state.");
    return;
  }

  console.log(`[appState] Persisting state to Firestore for chat ID: ${_state.chatId}`);
  const docRef = db.collection("chats").doc(_state.chatId);

  const updatePayload = {
    userData: _state.userData,
    'product-choice': _state.productChoice, // Use kebab-case for Firestore
  };

  try {
    await docRef.update(updatePayload);
    console.log("[appState] State successfully persisted.");
  } catch (error) {
    console.error("[appState] Error persisting state to Firestore:", error);
  }
}

function _notifySubscribers() {
  console.log("[appState] Notifying subscribers of state change.");
  for (const callback of _subscribers) {
    try {
      callback(JSON.parse(JSON.stringify(_state)));
    } catch (e) {
      console.error("[appState] Error in subscriber callback:", e);
    }
  }
}

// 4. Public API

export function getState() {
  return JSON.parse(JSON.stringify(_state));
}

export function subscribe(callback) {
  if (typeof callback !== 'function') {
    console.error("[appState] Subscriber must be a function.");
    return;
  }
  console.log("[appState] New subscriber added.");
  _subscribers.push(callback);
}

export async function updateProductChoice(newChoice) {
  console.log("[appState] Updating product choice:", newChoice);
  const oldChoice = JSON.stringify(_state.productChoice);
  _state.productChoice = { ..._state.productChoice, ...newChoice };
  
  if(oldChoice !== JSON.stringify(_state.productChoice)) {
    _notifySubscribers();
    await _persistState();
  }
}

export async function updateUserData(newUserData) {
  console.log("[appState] Updating user data:", newUserData);
  const oldUserData = JSON.stringify(_state.userData);
  _state.userData = { ..._state.userData, ...newUserData };

  if (oldUserData !== JSON.stringify(_state.userData)) {
    _notifySubscribers();
    await _persistState();
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
        console.warn("[appState] Initialization failed: initialData is missing or has no ID.");
        return;
    }
    console.log("[appState] Initializing app state with data:", initialData);

    _state.chatId = initialData.id;
    if (initialData.userData) {
        _state.userData = { ..._state.userData, ...initialData.userData };
    }
    // Handle the kebab-case from firestore
    if (initialData['product-choice']) {
        _state.productChoice = { ..._state.productChoice, ...initialData['product-choice'] };
    }

    // Notify subscribers to update the UI with the loaded state.
    _notifySubscribers();
}
