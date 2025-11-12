# Top-Level Plan: Gemini Integration

This document outlines the high-level plan for integrating the Gemini-powered Google Cloud Function into the web application.

## 1. PHASE 1: Frontend Service Replacement

- **Description:** This phase focuses on replacing the mock AI service with a real `fetch` call to the live Gemini Cloud Function. The primary goal is to establish a basic connection and ensure that the frontend can send a prompt and receive a text-based response.
- **Status:** ✅ Success

### 1.1 Modify AI Service
- **File Involved:** `src/services/gemini.js`

### 1.2 Modify Chat UI Handler
- **File Involved:** `src/chat/chatUi.js`

### 1.3 🚬 Smoke Test: Basic End-to-End Communication
- **Status:** ✅ Success
- **Log:** See PHASE 1 LOG.

## PHASE 1 LOG:
```
main.js:3 [main.js] STARTING APP - Version: 1.0.1 (Unification & Persistence)
main.js:10 [main.js] DOMContentLoaded listener attached.
main.js:12 [main.js] DOMContentLoaded event fired.
main.js:14 [main.js] Initializing Firebase...
main.js:21 [main.js] Firebase initialized successfully.
main.js:25 [main.js] Creating new chat session...
appState.js:118 [appState] Initializing app state with data: Object
appState.js:59 [appState] Notifying subscribers of state change.
main.js:27 [main.js] Chat session created with ID: 1762931563588
main.js:33 [main.js] Subscribing to chat messages for chat ID: 1762931563588
main.js:44 [main.js] Binding user message handler...
main.js:46 [main.js] User message handler bound.
main.js:52 [main.js] Loading configurator engine...
chatUi.js:29 {"source":"chatUi.js","step":"appendBatch","payload":{"messageCount":1}}
configuratorEngine.js:205 [configuratorEngine.js] Initial render call.
main.js:54 [main.js] Configurator engine loaded successfully.
chatUi.js:63 {"source":"chatUi.js","step":"addUserMessage","payload":{"chatId":"1762931563588","message":{"userType":"human","bubbleType":"chat-bubble","text":"hello","link":null,"timestamp":"2025-11-12T07:13:02.877Z"}}}
chatUi.js:29 {"source":"chatUi.js","step":"appendBatch","payload":{"messageCount":1}}
chatUi.js:144 {"source":"chatUi.js","step":"showTypingIndicator"}
gemini.js:8 {"source":"gemini.js","step":"request","payload":{"endpoint":"https://gemini-endpoint-yf2trly67a-uc.a.run.app/","prompt":"hello"}}
gemini.js:41 {"source":"gemini.js","step":"response-success","payload":{"status":"success","message":"Hello! How can I assist you today?","data":{}}}
chatUi.js:177 {"source":"chatUi.js","step":"hideTypingIndicator"}
chatUi.js:95 {"source":"chatUi.js","step":"addAiMessage","payload":{"chatId":"1762931563588","message":{"userType":"ai","bubbleType":"chat-bubble","text":"Hello! How can I assist you today?","link":null,"timestamp":"2025-11-12T07:13:07.218Z"}}}
```

---

## 2. PHASE 2: Backend Prompt Engineering & Structured Output

- **Description:** This phase focuses on enhancing the backend Cloud Function. The goal is to teach the Gemini model about the application's specific data schemas (`product-choice` and `user`) so it can return structured, actionable data instead of just a conversational string.
- **Status:** ✅ Success

### 2.1 Update Cloud Function Logic
- **File Involved:** `main.py` (Cloud Function)

### 2.2 🚬 Smoke Test: Structured Data Response
- **Status:** ✅ Success
- **Log:** See PHASE 2 LOG.

## PHASE 2 LOG:
```
# Request
curl -X POST https://gemini-endpoint-yf2trly67a-uc.a.run.app/ -H "Content-Type: application/json" -d '{
  "prompt": "Eu quero uma janela de correr com 2 folhas de vidro"
}'

# Response
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

---

## 3. PHASE 3: Frontend State Integration

- **Description:** The final phase is to connect the structured data from the AI to the frontend's state management. The goal is for the AI's response to directly and automatically update the product configurator or user data.
- **Status:** ✅ Success

### 3.1 Create State Orchestrator
- **File Involved:** `src/state/orchestrator.js` (New File)

### 3.2 Update Chat UI Handler
- **File Involved:** `src/chat/chatUi.js`

### 3.3 🚬 Smoke Test: Full Loop State Update
- **Status:** ✅ Success
- **Log:** See PHASE 3 LOG.

## PHASE 3 LOG:
```
gemini.js:41 {"source":"gemini.js","step":"response-success","payload":{"status":"success","message":"Certo! Você gostaria de uma janela. Há mais detalhes que gostaria de adicionar?","data":{"target":"product-choice","payload":{"type":"janela"}}}}
orchestrator.js:57 {"source":"orchestrator.js","step":"handleAiResponse-process","payload":{"target":"product-choice","payload":{"type":"janela"}}}
orchestrator.js:23 {"source":"orchestrator.js","step":"_translateProductChoice","payload":{"from":{"type":"janela"},"to":{"categoria":"janela"}}}
appState.js:85 [appState] Updating product choice: {categoria: 'janela'}
appState.js:59 [appState] Notifying subscribers of state change.
configuratorEngine.js:166 [configuratorEngine.js:renderLatestState] SUBSCRIBER TRIGGERED: State has changed. Re-rendering UI.
configuratorEngine.js:169 [configuratorEngine.js:renderLatestState] Fetched state: {categoria: 'janela', sistema: null, persiana: null, motorizada: null, material: null, …}
configuratorEngine.js:172 [configuratorEngine.js:renderLatestState] Computed new engine state. The next question is for facet: sistema
```
