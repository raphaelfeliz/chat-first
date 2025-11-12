# Feature Plan: Multi-Step & Proactive Handoff

This document outlines the plan to upgrade the AI-to-Human Handoff feature. The system will now proactively capture user contact information at any point in the conversation and use it in a guided, multi-step handoff flow.

---

## **Phase 1: Backend AI Enhancement & API Contract Change (COMPLETE)**

**Goal:** Update the AI's core prompt and the API's JSON contract to enable proactive, multi-intent data capture with a strict, predictable schema.

**Status:** Complete and verified via smoke test.

---

## **Phase 2: Frontend State Management**

**Goal:** Introduce a state management mechanism to track the handoff sub-conversation.

- **File:** `src/state/appState.js`
- **Action:** Introduce a `handoffState` property (`null`, `"needs_name"`, `"needs_contact"`, `"ready"`) and corresponding `set/get` functions.

### 2.1 🚬 Smoke Test: Verify State Management

- **Goal:** To confirm that the new `handoffState` can be set and retrieved correctly, and that changes to it properly notify subscribers.
- **Method:** We will use the browser's developer console to directly call the exported functions from `appState.js`.
- **Procedure:**
    1.  Open the application in the browser preview.
    2.  Open the browser's **Developer Console** (usually with F12 or Ctrl+Shift+I).
    3.  Import the state management module by typing:
        ```javascript
        const appState = await import('./src/state/appState.js');
        ```
    4.  Create a simple subscriber to log state changes to the console:
        ```javascript
        appState.subscribe(newState => console.log('Subscriber notified:', newState));
        ```
    5.  Change the handoff state:
        ```javascript
        appState.setHandoffState('needs_name');
        ```
    6.  **Expected Outcome:** The console should immediately log a message like: `Subscriber notified: { ... state object ... }`, and the new state object should show `handoffState: "needs_name"`.
    7.  Verify the getter works:
        ```javascript
        console.log('Getter result:', appState.getHandoffState());
        ```
    8.  **Expected Outcome:** The console should log: `Getter result: needs_name`.

---

## **Phase 3: Orchestration & UI**

**Goal:** Rework the frontend logic to manage the new state machine and handle proactive data capture.

- **File:** `src/state/orchestrator.js`
- **Action: Modify `handleAiResponse()`**
    1.  First, it will **always** check the response for `data.user` or `data['product-choice']` and update the state, regardless of handoff.
    2.  *Then*, if `data.talkToHuman` is `true`, it will check the (potentially just updated) state and decide which handoff step is next (`needs_name`, `needs_contact`, or `ready`), triggering the appropriate UI message (`askForName()`, etc.).

- **File:** `src/chat/chatUi.js`
- **Action: Modify `bindUserMessageHandler()`**
    1.  In the `submit` handler, check `if (getHandoffState() !== null)`.
    2.  If true, **hijack the normal flow**. Instead of calling the main AI, it will call a new `orchestrator.handleHandoffInput(userInput)` function, which will use a specialized, minimal AI prompt just to parse the name/contact info from the user's reply.
