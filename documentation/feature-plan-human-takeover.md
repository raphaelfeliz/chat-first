# Feature Plan: AI-to-Human Handoff

This document outlines the plan and implementation details for the AI-to-Human Handoff feature.

---
## PHASE 1: Backend AI Enhancement
- **Description:** This phase focused on modifying the backend Cloud Function (`main.py`) to recognize a user's intent to speak with a human and to signal this intent in its JSON response.
- **Status:** ✅ Complete

### 1.1 Modify `main.py` to add the "Human Handoff" intent
- **File(s) Involved:** `main.py`
- **Action:**
    1.  Added a new intent description to the `structured_prompt`.
    2.  Instructed the model to look for trigger phrases (e.g., "falar com um humano," "quero ajuda de uma pessoa").
    3.  Instructed the model to respond with `{"data": {"talkToHuman": true}}` when this intent is detected.

### 1.2 🚬 Smoke Test: AI Returns Correct JSON for Handoff Intent
- **Status:** ✅ Complete
- **Log:**
  ```json
  {
      "status": "success",
      "message": "Entendido. Vou te conectar com um atendente humano agora mesmo para que você possa obter a ajuda necessária.",
      "data": {
          "talkToHuman": true
      }
  }
  ```
---
## PHASE 2: Frontend Logic Integration
- **Description:** This phase focused on the frontend's logical layer, enabling the application to recognize the new signal from the AI and prevent other state updates when a handoff is requested.
- **Status:** ✅ Complete

### 2.1 Add a placeholder `showHumanHandoffBubble` function to `chatUi.js`
- **File(s) Involved:** `src/chat/chatUi.js`

### 2.2 Modify `orchestrator.js` to handle the `talkToHuman` flag
- **File(s) Involved:** `src/state/orchestrator.js`
- **Action:** Added a condition to `handleAiResponse` to check for `aiResponse.data.talkToHuman === true` and call `showHumanHandoffBubble()`.

### 2.3 🚬 Smoke Test: Console Log on Mock Handoff
- **Status:** ✅ Complete
- **Log:**
  ```
  Promise {<pending>}
  Orchestrator module loaded, calling handleAiResponse...
  SMOKE TEST: showHumanHandoffBubble called!
  handleAiResponse has been called.
  ```
---
## PHASE 3: UI Implementation & Dynamic Link
- **Description:** This final phase involved building the UI component for the handoff message and implementing a dynamic WhatsApp link that pre-fills the user's name and product selection.
- **Status:** ✅ Complete

### 3.1 Fully implement `showHumanHandoffBubble` in `chatUi.js`
- **File(s) Involved:** `src/chat/chatUi.js`
- **Action:** Replaced the placeholder function with logic to create a styled chat bubble containing a dynamically generated `<a>` tag.
- **Final Code:**
    ```javascript
    import { getState } from '../state/appState.js';
    // ... other imports

    export function showHumanHandoffBubble() {
      // 1. Get current state
      const currentState = getState();
      const { userData, productChoice } = currentState;

      // 2. Construct the dynamic message (with defensive checks)
      const name = (userData && userData.userName) || "";
      const productParts = [
        (productChoice && productChoice.categoria) || 'esquadrias',
        productChoice && productChoice.sistema,
        productChoice && productChoice.persiana,
        productChoice && productChoice.motorizada,
        productChoice && productChoice.material,
        productChoice && productChoice.folhas
      ].filter(Boolean);
      
      const productString = productParts.join(' | ');

      const message = `Meu nome é ${name}, \ntenho interesse em\n${productString}`;
      
      // 3. URL-encode the message
      const encodedMessage = encodeURIComponent(message);

      // 4. Create the final WhatsApp URL
      const whatsappUrl = `https://api.whatsapp.com/send?phone=5511976810216&text=${encodedMessage}`;

      // 5. Create and append the bubble
      const handoffBubble = document.createElement("div");
      handoffBubble.className = "flex justify-start";
      handoffBubble.innerHTML = `
        <div class=\"bg-green-500 text-white p-3 rounded-r-lg rounded-bl-lg max-w-xs shadow-sm\">
          <p class=\"text-sm\">Para falar com um especialista, <a href=\"${whatsappUrl}\" target=\"_blank\" class=\"underline font-bold\">clique aqui</a>.</p>
        </div>`;

      if (messageList) {
        hideTypingIndicator();
        messageList.appendChild(handoffBubble);
        scrollToBottom();
      }
    }
    ```

### 3.2 🚬 Smoke Test: Full Loop - Dynamic Handoff Bubble Appears
- **Status:** ✅ Complete
- **Outcome:** A green chat bubble appears with a clickable link. The link opens WhatsApp with a pre-populated message including the user's name and their selected product configuration, ready to be sent to the sales team. The critical `TypeError` bug was identified and fixed.
- **Final Verification Log:**
  ```
  Promise {<pending>}
  Testing human handoff...
  Handoff simulated.
  ```
