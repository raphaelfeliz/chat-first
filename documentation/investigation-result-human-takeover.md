# Investigation Result: AI-to-Human Handoff

This document summarizes the findings of the investigation phase for the "AI-to-Human Handoff" feature.

## 1. Findings

### 1.1. Backend Cloud Function (`main.py`)

*   **Source:** `main.py`
*   **Mechanism:** The AI's behavior is controlled by a large `structured_prompt` string that instructs the Gemini model.
*   **Modification Path:** A new intent, "Human Handoff," can be added to the prompt. The instructions will tell the model to detect user frustration or direct requests to speak to a person.
*   **Required Output:** When this intent is detected, the model will be instructed to return a specific JSON object: `{"data": {"talkToHuman": true}}`. This is a clean and explicit signal.

### 1.2. Frontend AI Response Orchestrator (`src/state/orchestrator.js`)

*   **Source:** `src/state/orchestrator.js`
*   **Key Function:** `handleAiResponse(aiResponse)` is the central function that processes all structured data returned by the AI.
*   **Modification Path:** This is the ideal location to intercept the new signal. An `if` condition can be added at the beginning of the function to check for the presence of `aiResponse.data.talkToHuman === true`.
*   **Control Flow:** By handling this case early and issuing a `return`, we can ensure no other conflicting state updates (like product configuration) are processed when a handoff is requested.

### 1.3. Frontend Chat UI (`src/chat/chatUi.js`)

*   **Source:** `src/chat/chatUi.js`
*   **Mechanism:** The `createMessageElement` and `appendBatch` functions are used for rendering standard chat messages.
*   **Modification Path:** For this unique, non-persistent UI element, the cleanest approach is to create a new, dedicated, exported function (e.g., `showHumanHandoffBubble`). This function will manually construct the required HTML for the WhatsApp link bubble and append it directly to the `messageList` DOM element, avoiding modification of the more generic rendering functions.

## 2. High-Level Execution Plan

The investigation confirms a clear and logical path to implementation across three distinct modules.

### Step 1: Modify Backend AI (`main.py`)

Update the `structured_prompt` to include the new "Human Handoff" intent, its trigger conditions (frustration, direct requests), and the required `{"data": {"talkToHuman": true}}` JSON output.

### Step 2: Modify Frontend Orchestrator (`src/state/orchestrator.js`)

In `handleAiResponse`, add logic to check for the `talkToHuman` flag in the AI's response. If it's true, call the new UI function from `chatUi.js` and halt further execution of the function.

### Step 3: Modify Frontend Chat UI (`src/chat/chatUi.js`)

Create and export the new `showHumanHandoffBubble` function. This function will be responsible for creating and rendering the specialized chat bubble containing the link to WhatsApp.
