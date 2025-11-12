
# UNIFICATION PLAN

## CONTEXT

Currently, the application maintains separate representations of its session state:

1.  **`userSelections` (Client-Side, In-Memory):** A local JavaScript object in `src/core/engine/configuratorEngine.js` that drives the product configurator UI in real-time. It is volatile and lost on page refresh.
2.  **`product-choice` (Server-Side, Persistent):** An object within the Firestore chat document, intended to be the saved record of the user's configuration. It is not currently updated after its initial creation.
3.  **`userData` (Server-Side, Persistent):** A second object in the same Firestore document (`userName`, `userEmail`, etc.) that is also created with `null` values and never updated.

## CHALLENGE

This separation of state representations leads to significant issues:

*   **Data Desynchronization:** The user's real-time selections in the configurator are never saved to the database. The state is not persistent.
*   **Lack of AI Context:** The backend and AI have no visibility into the user's current selections or data, preventing any form of intelligent, context-aware assistance.
*   **No Single Source of Truth:** Debugging is difficult as the "true" state of the user's session is ambiguous and split between volatile client-side memory and a stale database record.

## OBJECTIVE

To establish a **single, unified, and globally accessible "source of truth"** for the application's session state, encompassing both the user's **`productChoice`** and their **`userData`**. This global state manager will be the definitive authority for all session data.

---

## 1. SMOKE TEST: End-to-End State Synchronization

*   **Purpose:** To perform a single, high-level test that verifies the entire state management and persistence flow is working correctly from the user's interaction to the database and back.

*   **Test:**
    1.  Delete any existing chat data from Firestore to ensure a clean start.
    2.  Open the application and send a first message to initiate a new chat.
    3.  Interact with the product configurator and select the first available option (e.g., Categoria: "Janela").
    4.  Manually reload the entire browser page.

*   **Success:**
    1.  The `product-choice` object in the Firestore chat document is successfully updated with the user's selection (e.g., `{"categoria": "janela", ...}`).
    2.  After the page reloads, the configurator UI automatically loads the state from Firestore, correctly displays the "Janela" selection, and proceeds to the next configuration step.

## 1.1 Create the Global State Module
-   Create a new file at `src/core/state/appState.js` which will manage the application's session state and implement a pub/sub pattern for updates.
### 1.1 LOG
*   **2024-05-21:** Created `src/core/state/appState.js`. The module includes the private state object, a pub/sub system, a public API (`getState`, `updateProductChoice`, `updateUserData`), and a `setInitialState` function for Firestore integration. The foundation for Approach 1 is now in place.

## 1.2 Implement Firestore Synchronization
-   Add functions to `appState.js` that will allow it to connect to, load initial data from, and push subsequent updates to the active Firestore chat document.
### 1.2 LOG
*   **2024-05-21:** Enhanced `appState.js` with Firestore persistence. Imported `getDb` and added a `_persistState` function. The `updateProductChoice` and `updateUserData` functions now automatically save changes to Firestore. A `setChatId` function was also added to link the state to the correct Firestore document.


## 1.3 Refactor the Configurator Engine
-   Modify `src/core/engine/configuratorEngine.js` to remove its internal `userSelections` object and instead use the new `appState.js` module as its single source of truth for configuration data.
### 1.3 LOG
*   **2024-05-21:** Refactored `src/core/engine/configuratorEngine.js`. Removed the local `userSelections` object and integrated the engine with `appState.js`. The engine now subscribes to the global state and re-renders automatically when the state changes. It is now a reactive, stateless UI controller.


## 1.4 Update Chat Initialization Logic
-   Adjust the application's main entry point (`main.js` and/or `src/messageSetup/chat.js`) to correctly initialize the `appState.js` module when a new or existing chat session is loaded.
### 1.4 LOG
*   **2024-05-21:** Integrated the state module with the chat lifecycle. Modified `src/messageSetup/chat.js` to call the new `initializeAppState` function on both chat creation and initial load of an existing chat. This crucial step links the Firestore data to the UI on startup.


## 1.5 🧪 Final Test: Execute Smoke Test
-   Perform the exact steps defined in the **"1. SMOKE TEST"** section above to validate that the complete, end-to-end state management implementation is successful.
### 1.5 LOG

