# Investigation Plan: AI-to-Human Handoff

## Objective
The goal is to enable the AI to detect when a user wants to speak to a human. When this intent is detected, the AI should signal the frontend to display a "Talk to a Human" chat bubble, which will be a link to WhatsApp.

## Information Required

### 1. AI Prompt Engineering (Backend)
*   **File:** `main.py`
*   **Status:** ✅ **Analysis Complete**
*   **Action:** Add a third intent for "Human Handoff" to the `structured_prompt`, instructing the model to return `{"data": {"talkToHuman": true}}` when triggered.

### 2. Frontend Response Handling
*   **File:** `src/state/orchestrator.js`
*   **Status:** ✅ **Analysis Complete**
*   **Action:** In the `handleAiResponse` function, add a new conditional check at the beginning:
    ```javascript
    if (aiResponse.data && aiResponse.data.talkToHuman === true) {
        // Call a new function to show the human handoff message
        // (e.g., chatUi.showHumanHandoffBubble());
        return; // Stop further processing
    }
    ```
*   This approach ensures that if the AI wants to hand off, no other state updates (like `product-choice`) are accidentally processed.

### 3. UI Implementation
*   **Question:** Which file is responsible for rendering chat bubbles? (Placeholder: Likely `src/chat/chatUi.js`)
*   **Question:** How can a new, specialized chat bubble containing a WhatsApp link be created and rendered? What is the best function to create/export for this?
*   **Question:** What is the target WhatsApp number/link? (Placeholder: We will use `https://wa.me/1234567890` for now).

## File Investigation Plan

-   `main.py`: **(Done)**
-   `src/state/orchestrator.js`: **(Done)**
-   `src/chat/chatUi.js`: **(Next Step)** To determine how to render the new message type and create the `showHumanHandoffBubble` function.
-   `src/state/appState.js`: To see if a special message needs to be persisted.
