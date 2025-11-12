# Investigation Phase: Gemini Cloud Function Integration

## Objective
The primary goal is to replace the existing mock AI service with a real implementation that communicates with a new Gemini-powered Google Cloud Function. This involves updating both the frontend application to call the new endpoint and enhancing the backend function to understand the application's specific data schemas and return structured, actionable data.

## Information Gathered
*   **Cloud Function Endpoint:** `https://gemini-endpoint-yf2trly67a-uc.a.run.app/`
*   **Cloud Function Logic:**
    *   It's an HTTP endpoint that accepts POST requests.
    *   It correctly handles CORS preflight (OPTIONS) and standard requests.
    *   It expects a JSON payload: `{ "prompt": "<string>" }`.
    *   It instructs the Gemini model to return a JSON response with the keys: `"status"`, `"message"`, and `"data"`.
    *   It currently uses a generic prompt, which needs to be enhanced.

## Information Required & File Investigation Plan

To build a comprehensive execution plan, the following files must be analyzed:

1.  **`documentation/contracts/message.json`**:
    *   **Source:** `documentation/contracts/message.json`
    *   **Purpose:** To understand the exact JSON schema for a single chat message. This is crucial for teaching the AI how to interpret and format its own conversational responses.
    *   **Findings:**
        *   The schema is a simple JSON object with the following keys:
            *   `userType`: (string) Likely "human" or "ai".
            *   `bubbleType`: (string) Appears to be for UI styling, e.g., "chat-bubble".
            *   `text`: (string) The core message content.
            *   `link`: (string|null) An optional URL.
            *   `timestamp`: The description "A JavaScript Date object" is ambiguous for JSON. This is likely a placeholder for a server-generated timestamp (e.g., Firestore `serverTimestamp()`) or an ISO 8601 string. The AI will not be responsible for generating this timestamp.
        *   **Conclusion:** The AI's primary output for a conversational response will be the `text` field. The other fields (`userType`, `bubbleType`) will be set by the frontend application logic when it creates the message object before adding it to the state.

2.  **`documentation/contracts/product-choice.json`**:
    *   **Source:** `documentation/contracts/product-choice.json`
    *   **Purpose:** To understand the schema for the user's selections in the product configurator. This is the most critical schema for the AI to learn. It needs to extract user intent (e.g., "I want a fast processor") and map it to a valid update for this `product-choice` object.
    *   **Findings:**
        *   The schema defines the different facets of a configurable product:
            *   `categoria`: (string | null)
            *   `sistema`: (string | null)
            *   `persiana`: (string | null)
            *   `motorizada`: (string | null)
            *   `material`: (string | null)
            *   `folhas`: (string | null)
        *   The values are strings or null, representing the user's choice for each facet.
        *   **Crucial Missing Information:** The *possible values* for each of these keys are not defined in this file. To effectively instruct the AI, I need to know the valid options for `categoria`, `sistema`, etc. I will need to find this information, likely in `src/configurator/productCatalog.js`.

3.  **`documentation/contracts/user.json`**:
    *   **Source:** `documentation/contracts/user.json`
    *   **Purpose:** To understand the schema for user-specific data. The AI might need to update this if it, for example, asks for and receives the user's name or other preferences.
    *   **Findings:**
        *   The schema contains keys for basic user contact information: `userName`, `userPhone`, and `userEmail`.
        *   All fields are nullable strings.
        *   **Conclusion:** This provides a clear target for the AI. If a user says "My name is John" or "my email is john@example.com", the AI can be instructed to populate this object and send it back in the `data` payload of its response.

4.  **`src/configurator/productCatalog.js`**:
    *   **Source:** `src/configurator/productCatalog.js`
    *   **Purpose:** To find the possible values for the `product-choice` schema fields.
    *   **Findings:**
        *   This file contains the `PRODUCT_CATALOG` array, which is the source of truth for all product configurations. By analyzing the data, I have extracted the possible values for each field in the `product-choice` schema:
            *   `categoria`: "janela", "porta"
            *   `sistema`: "janela-correr", "porta-correr", "maxim-ar", "giro"
            *   `persiana`: "sim", "nao"
            *   `persianaMotorizada`: "motorizada", "manual", null
            *   `material`: "vidro", "vidro + veneziana", "lambri", "veneziana", "vidro + lambri"
            *   `folhas`: 1, 2, 3, 4, 6
        *   **Conclusion:** This is the critical information needed to properly instruct the Gemini model in the Cloud Function. The prompt will now include these specific enumerations to ensure the AI only outputs valid data for the `product-choice` state.

5.  **`src/services/gemini.js`**:
    *   **Source:** `src/services/gemini.js`
    *   **Purpose:** To analyze the current mock `getAiResponse` function. This file will be the primary target for modification on the frontend. The current logic will be replaced with a `fetch` call to the live Cloud Function endpoint.
    *   **Findings:**
        *   The file contains a mock `async` function named `getAiResponse`.
        *   It currently uses simple keyword matching to return hardcoded string responses.
        *   It simulates a network delay using `setTimeout`.
        *   The function returns a `Promise<string>`.
    *   **Conclusion:** This is the exact location for the frontend change. The existing mock logic will be replaced entirely. The new implementation will use the `fetch` API to make a POST request to the production Gemini endpoint (`https://gemini-endpoint-yf2trly67a-uc.a.run.app/`). The function will be updated to return the parsed JSON object from the endpoint, changing its effective return type to `Promise<object>`.

6.  **`src/main.js`**:
    *   **Purpose:** To see how `getAiResponse` is currently called and how its string response is handled. This will inform how the new, structured JSON response from the updated service should be processed to update the application's state.

7.  **`src/state/appState.js`**:
    *   **Purpose:** To understand the functions available for updating the global state (e.g., `updateProductChoice`, `updateUserData`). The new response from the AI service will need to be parsed and used to call these state update functions.

## High-Level Approach Outline

1.  **Backend Enhancement (Cloud Function):**
    *   A new, highly-detailed `structured_prompt` will be engineered.
    *   This prompt will include the full JSON schemas for `product-choice` and `user`, including the enumerations found in `productCatalog.js`.
    *   It will contain explicit instructions for the AI:
        *   Analyze the user's text.
        *   Determine if the user's intent is to modify their product selections or update their user data.
        *   If so, construct a valid JSON object matching the appropriate schema (`product-choice` or `user`).
        *   Place this new object within the `"data"` field of the main response payload, along with a key indicating which part of the state to update (e.g., `{ "target": "product-choice", "payload": { ... } }`).
        *   Always provide a friendly, conversational string in the `"message"` field.

2.  **Frontend Integration (Web App):**
    *   **Modify `gemini.js`:** The `getAiResponse` function will be rewritten to be an `async` function that performs a `fetch` POST request to the live endpoint, sending the user's input as the `prompt`. It will parse the JSON response and return it.
    *   **Modify `main.js` (or orchestrator):** The code that calls `getAiResponse` will be updated to handle a JSON object instead of a simple string. It will inspect the `data` field of the response to see if a state update is required.
    *   **Update State:** If the response `data` contains a `target` and `payload`, the application will call the corresponding update function from `appState.js` (e.g., `updateProductChoice(response.data.payload)`). The conversational `message` will be displayed in the chat UI as the AI's response.
