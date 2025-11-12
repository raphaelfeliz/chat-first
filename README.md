# AI-Powered Product Configurator

## What It Is
This is a modern, AI-enhanced web application that functions as an interactive product configurator integrated with a real-time chat interface. It allows users to configure a product either by clicking through a guided set of options or by simply describing what they want in natural language using the chat.

The application is built with a framework-less approach using vanilla HTML, CSS (Tailwind), and modern JavaScript (ES Modules). It leverages Firebase Firestore for real-time data persistence and a Google Cloud Function powered by the Gemini Pro model for its AI capabilities.

## What It Does
- **Dual-Mode Interaction:** Users can configure products in two ways:
    1.  **Manual Configuration:** A classic, guided questionnaire where each answer filters a product catalog and dynamically presents the next relevant question.
    2.  **AI-Powered Configuration:** Users can type natural language requests (e.g., "I want a 2-panel sliding glass door") into the chat, and the AI will interpret the request and automatically update the product configurator UI.
- **Real-time Chat & State Sync:** A persistent chat interface sits alongside the configurator. All interactions, whether through chat or clicks, are part of a single, unified session state that is tied to the chat.
- **Session Persistence:** The user's progress in the configurator and their entire chat history are automatically saved. If the user leaves and comes back, their session is seamlessly restored.

---

## How It Works

### High-Level Architecture
The application's core is a unified state management system (`src/state/appState.js`) that acts as the single source of truth. The Configurator UI, the Chat UI, and the AI response handler all read from and write to this central state. This state is automatically synchronized in real-time with a document in Firebase Firestore, ensuring data is always persistent and consistent.

![Architecture Diagram](https://storage.googleapis.com/static.aifire.dev/architect-gemini-demo/architecture.png)

### Manual Configuration Flow
1.  **Initialization:** The `configuratorEngine.js` module subscribes to changes in the central `appState`.
2.  **Rendering:** Upon any state change, the engine evaluates the user's current selections.
3.  **Logic:** It filters an internal product catalog based on those selections and determines the next logical question (facet) to ask the user.
4.  **UI Update:** The engine renders the appropriate question and a set of interactive option cards.
5.  **User Selection:** When a user clicks an option, the engine updates the central `appState`, which triggers the cycle again and persists the choice to Firestore.

### AI-Powered Configuration Flow
This flow demonstrates the true power of the integration, turning natural language into application state changes.
1.  **User Prompt:** The user types a message like `"Eu quero uma janela de correr com 2 folhas de vidro"` into the chat.
2.  **Frontend Service:** The `gemini.js` service sends this raw prompt to a secure Google Cloud Function endpoint.
3.  **Backend Prompt Engineering:** The Python Cloud Function (`main.py`) receives the prompt. It doesn't just forward it to the AI; it wraps the user's text within a carefully engineered **structured prompt**. This master prompt instructs the Gemini model to act as an expert assistant, analyze the user's request, and **always respond in a specific JSON format**.
4.  **AI Response:** The Gemini model processes the request and returns a structured JSON object, not just a conversational reply. For example:
    ```json
    {
        "status": "success",
        "message": "Ok, selecionei para você uma janela de correr com 2 folhas de vidro. Deseja algo mais?",
        "data": {
            "target": "product-choice",
            "payload": {
                "type": "janela",
                "mechanism": "janela-correr",
                "leaves": 2,
                "material": "vidro"
            }
        }
    }
    ```
5.  **Frontend Orchestration:** The frontend receives this object. The `chatUi.js` module displays the friendly `message` to the user. Simultaneously, it passes the entire object to the `orchestrator.js` module.
6.  **Schema Translation:** The orchestrator's job is to act as a translator. It takes the AI's `payload` (e.g., `{"type": "janela"}`) and converts it into the schema that the application's state manager understands (e.g., `{"categoria": "janela"}`).
7.  **State Update:** The orchestrator dispatches this translated payload to the central `appState.js`, which updates the application's state.
8.  **Automatic UI Render:** Because the `configuratorEngine.js` is subscribed to `appState`, this change automatically triggers a re-render of the UI, visually updating the product selections to match the user's spoken request.

### Chat & Session Flow
1.  **Initialization:** On first load, `main.js` checks `localStorage` for an existing `chatId`.
2.  **New Session:** If no `chatId` is found, the first message sent by the user triggers the creation of a new chat document in Firestore. The ID of this new document is saved as the `chatId` in `localStorage`.
3.  **Existing Session:** If a `chatId` is found, the application fetches the corresponding chat document, restoring the entire session state, including configurator choices and message history.

---

## Key Technologies
- **Frontend:**
    - Vanilla JavaScript (ES Modules)
    - Tailwind CSS
    - No frameworks
- **Backend & AI:**
    - **Firebase Firestore:** Real-time, NoSQL database for session and state persistence.
    - **Google Cloud Functions:** Serverless backend logic written in Python.
    - **Google Gemini Pro:** The language model providing the natural language understanding and structured data generation.
- **Build/Dev Environment:**
    - Vite

---

## Project Structure
```
.
├── src/
│   ├── chat/
│   │   └── chatUi.js           # Handles rendering chat bubbles and user input form
│   ├── services/
│   │   └── gemini.js           # Service to communicate with the backend Gemini Cloud Function
│   ├── state/
│   │   ├── appState.js         # The central, unified state management module
│   │   └── orchestrator.js     # Translates AI responses into application state changes
│   ├── utils/
│   │   ├── domRefs.js          # Centralized DOM element references
│   │   └── sanitizers.js       # HTML sanitization utilities
│   ├── configuratorEngine.js   # Renders the product configurator UI based on state
│   ├── productCatalog.js       # Defines the available products and their attributes
│   └── main.js                 # Main application entry point, initialization logic
│
├── public/
│   └── ...                     # Static assets
│
├── main.py                     # The Python source for the Google Cloud Function
├── index.html                  # Main HTML file
└── README.md                   # This file
```
