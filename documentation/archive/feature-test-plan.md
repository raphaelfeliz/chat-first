
# Feature Test Plan

This document outlines the tests for the core features of the application. The status of each test should be updated manually after visual and functional verification in the browser and Firestore.

---

# 1. Product Configurator Engine
- **What it does:** Guides the user through a series of questions (facets) to narrow down a product catalog. It reacts to user selections by presenting the next relevant question and options.
- **Test 1: (OK)** - **Initial Selection and Progression:**
  - **Action:** Load the application with a fresh state. In the product configurator, select the first available option for the first question (e.g., Categoria: "Janela").
  - **Expected Outcome:** The UI should immediately update to display the *next* question in the sequence (e.g., "Qual sistema de abertura você prefere?") with a new set of options relevant to "Janela".
## status: OK
---

# 2. Chat Initialization & Persistence
- **What it does:** Creates a new chat session in Firestore when the user sends their first message. It generates a unique `chatId` and stores it locally to maintain the session across interactions.
- **Test 1: (ok)** - **First Message Creates Chat:**
  - **Action:** Clear any existing `chatId` from the browser's `localStorage`. Send a new message using the chat input.
  - **Expected Outcome:** A new document is created in the `chats` collection in Firestore. The ID of this new document is then stored in `localStorage` under the key `chatId`.

---

# 3. Unified State End-to-End Test
- **What it does:** Verifies that user choices in the product configurator are saved to the active chat session in Firestore and that this state is correctly restored when the application is reloaded.
- **Test 1: (OK)** - **State Persistence and Reload:**
  - **Action:** 
    1. Perform the test for "Chat Initialization" to ensure a chat session is active.
    2. In the product configurator, make a selection (e.g., Categoria: "Janela").
    3. Wait for the state to be saved (can be confirmed by a network request in the dev tools).
    4. Manually reload the entire browser page.
  - **Expected Outcome:** After the reload, the product configurator UI should automatically reflect the "Janela" selection and present the subsequent question, proving the state was successfully persisted and reloaded from Firestore.

