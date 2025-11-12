# Investigation Result: Automatic Facet Question in Chat

This document summarizes the findings of the investigation phase and outlines the execution plan for automatically adding a chat bubble with the latest configurator facet question.

## 1. Findings

### 1.1. `src/configurator/configuratorEngine.js`

*   **Source:** `src/configurator/configuratorEngine.js`
*   **Key Function:** `renderEngineState(state)` is the function responsible for rendering the configurator's UI.
*   **Question Source:** Inside `renderEngineState`, the next question's text is available in the `state.currentQuestion.title` property.
*   **Trigger Point:** The ideal place to trigger the new functionality is within `renderEngineState`, immediately after the `questionEl.textContent = title;` line.

### 1.2. `src/chat/chatUi.js`

*   **Source:** `src/chat/chatUi.js`
*   **Key Function:** The file contains a function `createMessageElement(message)` which creates the DOM for a message. The exported function `appendBatch(messages)` adds an array of message elements to the chat.
*   **Message Creation:** The `bindUserMessageHandler` function demonstrates how to create a message object and how to use an `addMessageFn` (passed from `main.js`) to add it to the chat's data store. The key is to construct a message object like `{ userType: "ai", text: "..." }` and call `addMessageFn`.

### 1.3. `src/main.js`

*   **Source:** `src/main.js`
*   **Wiring:** This file is the central hub. It imports `addMessage` from `src/chat/chatApi.js` and passes it to `bindUserMessageHandler` in `src/chat/chatUi.js`. It also dynamically imports and initializes `configuratorEngine.js`.
*   **Communication:** There is no direct communication channel between `configuratorEngine.js` and `chatUi.js`. A new mechanism is needed to allow the configurator to trigger an action in the chat UI.

## 2. Execution Plan

To avoid tightly coupling the `configuratorEngine` and `chatUi`, the best approach is to create a simple, centralized event bus in `main.js`. This will allow the modules to communicate indirectly.

### Step 1: Create a Centralized Event Emitter in `main.js`

A simple event emitter will be created in `main.js` to act as a message broker between modules.

### Step 2: Modify `configuratorEngine.js` to Emit an Event

The `configuratorEngine` will be given the `emit` function from the event emitter. It will call this function whenever a new facet question is rendered, passing the question text as the payload.

### Step 3: Modify `chatUi.js` and `main.js` to Listen for the Event

A new function, `addAiMessage`, will be added to `chatUi.js`. In `main.js`, a listener will be set up for the `facetQuestionUpdated` event. When the event is fired, this listener will call `addAiMessage`, passing the question text and the `addMessage` function from `chatApi.js`.
