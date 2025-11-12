/*
path: src/state/orchestrator.js
purpose: Central orchestrator to process the AI's structured responses and trigger the appropriate updates in the global application state.
summary: This module acts as the translator and dispatcher between the AI service and the `appState`. It receives the structured JSON output from Gemini, validates the data, and uses the `target` field (e.g., 'product-choice' or 'user') to decide which state setter function to call. For 'product-choice', it merges the incoming AI payload with the current configuration state before updating.
imports:
(import) updateProductChoice: summary: Updates the product configuration portion of the global state and persists changes. (from ./appState.js)
(import) updateUserData: summary: Updates the user data portion of the global state and persists changes. (from ./appState.js)
(import) getState: summary: Retrieves the current snapshot of the entire global state. (from ./appState.js)
functions:
(export) handleAiResponse: summary: Receives the AI response object, validates it, selects the correct update path based on the 'target' field, and calls the appropriate state update function.
*/
import { updateProductChoice, updateUserData, getState } from './appState.js';

/**
 * @fileoverview Central orchestrator to process AI responses and trigger state updates.
 */

/**
 * Processes the AI's structured response, orchestrates translation, and triggers the appropriate state update.
 * @param {object} aiResponse The full response object from the getAiResponse service.
 */
export function handleAiResponse(aiResponse) {
    console.groupCollapsed("🧠 orchestrator.js: handleAiResponse");

    if (!aiResponse || !aiResponse.data) {
        console.warn("🟡 AI response is missing 'data' field. Aborting.", { response: aiResponse });
        console.groupEnd();
        return;
    }

    const { target, payload } = aiResponse.data;

    // This is a legacy check for the old `talkToHuman` boolean.
    // The new flow uses the `target: 'user-data'` with a payload.
    if (aiResponse.data.talkToHuman) {
        console.group("🤝 AI Handoff Requested (Legacy)");
        console.log("AI requested human agent intervention via the `talkToHuman` boolean.");
        console.log("This is a legacy method. The new method is `target: 'user-data'`. Please update the AI prompt.");
        console.groupEnd();
        // Here you would add logic to escalate to a human agent
        console.groupEnd(); // End main orchestrator group
        return;
    }

    if (!target || !payload) {
        console.warn("🟡 AI response data is missing 'target' or 'payload'. Aborting.", { data: aiResponse.data });
        console.groupEnd();
        return;
    }

    console.log(`🎯 Processing AI target: ${target}`, { payload });

    switch (target) {
        case 'product-choice':
            console.group("🛠️ Updating Product Choice");
            const currentState = getState();
            const mergedState = { ...currentState.productChoice, ...payload };
            console.log("Merging AI payload with current state:", {
                before: currentState.productChoice,
                payload: payload,
                after: mergedState
            });
            updateProductChoice(mergedState);
            console.log("✅ updateProductChoice has been called.");
            console.groupEnd();
            break;

        case 'user-data':
            console.group("👤 Updating User Data");
            if (payload.talkToHuman === true) {
                console.log("🤝 Handoff Started: AI requested to talk to a human.");
            }
            console.log("Payload to be applied:", payload);
            updateUserData(payload);
            console.log("✅ updateUserData has been called.");
            console.groupEnd();
            break;

        default:
            console.error(`❌ Unknown AI Target: '${target}'. The orchestrator does not know how to handle this. Update aborted.`, {
                target: target,
                payload: payload
            });
            break;
    }

    console.groupEnd(); // End main orchestrator group
}