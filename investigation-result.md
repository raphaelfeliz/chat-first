# Investigation Result

This document summarizes the findings of the investigation phase for the Gemini Cloud Function integration. It provides a comprehensive overview of the application's architecture, data schemas, and the current implementation of the AI service.

## 1. Data Schemas

This section details the JSON schemas used in the application.

### 1.1. `message.json`

*   **Source:** `documentation/contracts/message.json`
*   **Description:** Defines the structure of a single chat message.
*   **Schema:**
    ```json
    {
        "userType": "string",
        "bubbleType": "string",
        "text": "string",
        "link": "string | null",
        "timestamp": "object"
    }
    ```
*   **Notes:**
    *   `userType`: Indicates whether the message is from a "human" or "ai".
    *   `bubbleType`: Used for UI styling.
    *   `timestamp`: The contract mentions a "JavaScript Date object", which is ambiguous for JSON. This will likely be handled by Firestore's `serverTimestamp()` or a similar mechanism.

### 1.2. `product-choice.json`

*   **Source:** `documentation/contracts/product-choice.json` and `src/configurator/productCatalog.js`
*   **Description:** Represents the user's selected product configuration.
*   **Schema:**
    ```json
    {
        "categoria": "string | null",
        "sistema": "string | null",
        "persiana": "string | null",
        "motorizada": "string | null",
        "material": "string | null",
        "folhas": "string | null"
    }
    ```
*   **Enumerations:**
    *   `categoria`: "janela", "porta"
    *   `sistema`: "janela-correr", "porta-correr", "maxim-ar", "giro"
    *   `persiana`: "sim", "nao"
    *   `persianaMotorizada`: "motorizada", "manual", null
    *   `material`: "vidro", "vidro + veneziana", "lambri", "veneziana", "vidro + lambri"
    *   `folhas`: 1, 2, 3, 4, 6

### 1.3. `user.json`

*   **Source:** `documentation/contracts/user.json`
*   **Description:** Represents user-specific data.
*   **Schema:**
    ```json
    {
        "userName": "string | null",
        "userPhone": "string | null",
        "userEmail": "string | null"
    }
    ```

## 2. Application Flow

This section describes the application's high-level execution flow, from initialization to message handling.

### 2.1. Initialization

*   **Source:** `src/main.js`
*   **Flow:**
    1.  The `DOMContentLoaded` event triggers the application's initialization.
    2.  `initFirebase()` is called to set up the Firebase connection.
    3.  `createChat()` is called to create a new chat session in Firestore, which returns a `chatId`.
    4.  The application subscribes to the chat document in Firestore using the `chatId`.
    5.  `bindUserMessageHandler()` is called to set up the event listener for the chat input form.
    6.  The `configuratorEngine.js` module is loaded.

### 2.2. Message Handling

*   **Source:** `src/chat/chatUi.js`, `src/chat/chatApi.js` (and `src/services/gemini.js` for the mock AI response)
*   **Flow:**
    1.  The user types a message in the chat input and submits the form.
    2.  The `submit` event listener in `bindUserMessageHandler()` in `src/chat/chatUi.js` is triggered.
    3.  A `message` object is created with `userType: "human"`.
    4.  `addMessage()` from `src/chat/chatApi.js` is called with the `chatId` and the `message` object.
    5.  `addMessage()` adds the user's message to the `messages` array in the chat document in Firestore.

## 3. Mock AI Service

*   **Source:** `src/services/gemini.js`
*   **Description:** The current implementation uses a mock AI service that will be replaced with a call to the Gemini Cloud Function.
*   **Function:** `getAiResponse(userInput)`
*   **Logic:**
    *   It's an `async` function that simulates a network delay with `setTimeout`.
    *   It uses simple keyword matching to return hardcoded string responses.
    *   It returns a `Promise<string>`.

This concludes the investigation phase. The information gathered here will be used to create a detailed execution plan for integrating the Gemini Cloud Function.