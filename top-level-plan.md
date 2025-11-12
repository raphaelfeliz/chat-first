# Top-Level Plan: Automatic Facet Question in Chat

This document outlines the high-level plan for automatically adding a new AI chat bubble to the chat history whenever the product configurator UI updates to display a new question.

---

## 1. PHASE 1: Centralized Event Emitter

- **Description:** This phase focuses on creating a simple event emitter in `main.js`. This will serve as a central message broker to decouple communication between the `configuratorEngine` and the `chatUi` modules.
- **Status:** ✅ Complete

### 1.1 Create Event Emitter in `main.js`
- **File Involved:** `src/main.js`

### 1.2 🚬 Smoke Test: Application Loads Successfully
- **Status:** ✅ Complete
- **Log:** See PHASE 1 LOG.

## PHASE 1 LOG:
```
main.js:3 [main.js] STARTING APP - Version: 1.0.1 (Unification & Persistence)
main.js:26 [main.js] DOMContentLoaded listener attached.
main.js:28 [main.js] DOMContentLoaded event fired.
main.js:30 [main.js] Initializing Firebase...
main.js:37 [main.js] Firebase initialized successfully.
main.js:41 [main.js] Creating new chat session...
appState.js:118 [appState] Initializing app state with data: {id: '1762935477219', timestamp: lm, userData: {…}, messages: Array(1), product-choice: {…}}
appState.js:59 [appState] Notifying subscribers of state change.
main.js:43 [main.js] Chat session created with ID: 1762935477219
main.js:49 [main.js] Subscribing to chat messages for chat ID: 1762935477219
main.js:60 [main.js] Binding user message handler...
main.js:62 [main.js] User message handler bound.
main.js:68 [main.js] Loading configurator engine...
configuratorEngine.js:1 [configuratorEngine.js] Script starting...
configuratorEngine.js:7 [configuratorEngine.js] Attempting to import from './productCatalog.js'
appState.js:118 [appState] Initializing app state with data: {id: '1762935477219', messages: Array(1), product-choice: {…}, timestamp: ri, userData: {…}}
appState.js:59 [appState] Notifying subscribers of state change.
chatUi.js:30 {"source":"chatUi.js","step":"appendBatch","payload":{"messageCount":1}}
configuratorEngine.js:10 [configuratorEngine.js] Successfully imported from './productCatalog.js' in 182.50ms
configuratorEngine.js:202 [configuratorEngine.js] Subscribing render function to appState changes.
appState.js:80 [appState] New subscriber added.
configuratorEngine.js:205 [configuratorEngine.js] Initial render call.
configuratorEngine.js:166 [configuratorEngine.js:renderLatestState] SUBSCRIBER TRIGGERED: State has changed. Re-rendering UI.
configuratorEngine.js:167 [configuratorEngine.js:renderLatestState] Fetching latest state from appState...
configuratorEngine.js:169 [configuratorEngine.js:renderLatestState] Fetched state: {categoria: null, sistema: null, persiana: null, motorizada: null, material: null, …}
configuratorEngine.js:172 [configuratorEngine.js:renderLatestState] Computed new engine state. The next question is for facet: categoria
configuratorEngine.js:175 [configuratorEngine.js:renderLatestState] UI rendering complete.
main.js:70 [main.js] Configurator engine loaded successfully.
```

---

## 2. PHASE 2: Emit Event from Configurator

- **Description:** This phase focuses on modifying the `configuratorEngine.js` module. It will be updated to accept the event emitter's `emit` function during its initialization and call it whenever a new facet question is rendered to the UI.
- **Status:** ✅ Complete

### 2.1 Modify `configuratorEngine.js` to emit event
- **File Involved:** `src/configurator/configuratorEngine.js`

### 2.2 Update `main.js` to pass emitter
- **File Involved:** `src/main.js`

### 2.3 🚬 Smoke Test: Event Emission on Facet Update
- **Status:** ✅ Complete
- **Log:** See PHASE 2 LOG.

## PHASE 2 LOG:
```
main.js:3 [main.js] STARTING APP - Version: 1.0.1 (Unification & Persistence)
main.js:36 [main.js] DOMContentLoaded listener attached.
main.js:38 [main.js] DOMContentLoaded event fired.
main.js:40 [main.js] Initializing Firebase...
main.js:47 [main.js] Firebase initialized successfully.
main.js:51 [main.js] Creating new chat session...
appState.js:118 [appState] Initializing app state with data: {id: '1762935665997', timestamp: lm, userData: {…}, messages: Array(1), product-choice: {…}}
appState.js:59 [appState] Notifying subscribers of state change.
main.js:53 [main.js] Chat session created with ID: 1762935665997
main.js:59 [main.js] Subscribing to chat messages for chat ID: 1762935665997
main.js:70 [main.js] Binding user message handler...
main.js:72 [main.js] User message handler bound.
main.js:78 [main.js] Loading configurator engine...
configuratorEngine.js:1 [configuratorEngine.js] Script starting...
configuratorEngine.js:7 [configuratorEngine.js] Attempting to import from './productCatalog.js'
appState.js:118 [appState] Initializing app state with data: {id: '1762935665997', product-choice: {…}, messages: Array(1), userData: {…}, timestamp: ri}
appState.js:59 [appState] Notifying subscribers of state change.
chatUi.js:30 {"source":"chatUi.js","step":"appendBatch","payload":{"messageCount":1}}
configuratorEngine.js:10 [configuratorEngine.js] Successfully imported from './productCatalog.js' in 178.30ms
configuratorEngine.js:220 [configuratorEngine.js] Subscribing render function to appState changes.
appState.js:80 [appState] New subscriber added.
configuratorEngine.js:223 [configuratorEngine.js] Initial render call.
configuratorEngine.js:181 [configuratorEngine.js:renderLatestState] SUBSCRIBER TRIGGERED: State has changed. Re-rendering UI.
configuratorEngine.js:182 [configuratorEngine.js:renderLatestState] Fetching latest state from appState...
configuratorEngine.js:184 [configuratorEngine.js:renderLatestState] Fetched state: {categoria: null, sistema: null, persiana: null, motorizada: null, material: null, …}
configuratorEngine.js:187 [configuratorEngine.js:renderLatestState] Computed new engine state. The next question is for facet: categoria
configuratorEngine.js:190 [configuratorEngine.js:renderLatestState] UI rendering complete.
main.js:80 [main.js] Configurator engine loaded successfully.
main.js:82 {"source":"main.js","step":"init.configuratorEngine","payload":{"emitter":"defined"}}
configuratorEngine.js:198 [configuratorEngine.js:init] Initializing with event emitter.
configuratorEngine.js:203 [configuratorEngine.js:applySelection] User clicked. Facet: "categoria", Value: "janela"
configuratorEngine.js:204 [configuratorEngine.js:applySelection] Reading current state from appState...
configuratorEngine.js:206 [configuratorEngine.js:applySelection] Current state is: {categoria: null, sistema: null, persiana: null, motorizada: null, material: null, …}
configuratorEngine.js:209 [configuratorEngine.js:applySelection] Calculated next state to be: {categoria: 'janela', sistema: null, persiana: null, motorizada: null, material: null, …}
configuratorEngine.js:211 [configuratorEngine.js:applySelection] Dispatching 'updateProductChoice' to appState to persist and notify...
appState.js:85 [appState] Updating product choice: {categoria: 'janela', sistema: null, persiana: null, motorizada: null, material: null, …}
appState.js:59 [appState] Notifying subscribers of state change.
configuratorEngine.js:181 [configuratorEngine.js:renderLatestState] SUBSCRIBER TRIGGERED: State has changed. Re-rendering UI.
configuratorEngine.js:182 [configuratorEngine.js:renderLatestState] Fetching latest state from appState...
configuratorEngine.js:184 [configuratorEngine.js:renderLatestState] Fetched state: {categoria: 'janela', sistema: null, persiana: null, motorizada: null, material: null, …}
configuratorEngine.js:187 [configuratorEngine.js:renderLatestState] Computed new engine state. The next question is for facet: sistema
configuratorEngine.js:154 {"source":"configuratorEngine.js","step":"emitEvent","payload":{"event":"facetQuestionUpdated","question":"Qual sistema de abertura você prefere?"}}
configuratorEngine.js:190 [configuratorEngine.js:renderLatestState] UI rendering complete.
appState.js:42 [appState] Persisting state to Firestore for chat ID: 1762935665997
appState.js:52 [appState] State successfully persisted.
configuratorEngine.js:213 [configuratorEngine.js:applySelection] 'updateProductChoice' has completed (state persisted).
```

---

## 3. PHASE 3: Listen for Event and Add Chat Bubble

- **Description:** The final phase is to implement the logic that listens for the `facetQuestionUpdated` event and adds a corresponding AI message to the chat UI. This involves adding a new function to `chatUi.js` and setting up the listener in `main.js`.
- **Status:** 🟡 Pending

### 3.1 Create `addAiMessage` function in `chatUi.js`
- **File Involved:** `src/chat/chatUi.js`

### 3.2 Create Event Listener in `main.js`
- **File Involved:** `src/main.js`

### 3.3 🚬 Smoke Test: Full Loop - New Chat Bubble on Facet Update
- **Status:** 🟡 Pending
- **Log:** See PHASE 3 LOG.

## PHASE 3 LOG:
```

```
