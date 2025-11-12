# Investigation Phase: Automatic Facet Question in Chat

## Objective
The primary goal is to automatically add a new AI chat bubble to the chat history whenever the product configurator UI updates to display a new question (facet). The text of the chat bubble should be identical to the question text shown in the configurator.

## Information Required & File Investigation Plan

To build a comprehensive execution plan, the following files must be analyzed:

1.  **`src/configurator/configuratorEngine.js`**:
    *   **Purpose:** To locate the exact part of the code where the next facet question is determined and rendered. We need to identify the function and the variable that holds the question text.

2.  **`src/chat/chatUi.js`**:
    *   **Purpose:** To identify the function responsible for adding a new AI-generated message to the chat interface. We need to understand its signature to call it correctly.

3.  **`src/state/appState.js`**:
    *   **Purpose:** To understand the application's state management and pub/sub mechanism. The key is to determine the best way to signal an event from the configurator engine to the chat UI. Can the new facet question be a part of the global state, or should a different communication pattern be used?
