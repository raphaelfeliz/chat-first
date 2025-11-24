/*
path: src/state/orchestrator.js
purpose: Central orchestrator to process the AI's structured responses and trigger the appropriate updates in the global application state.
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
    if (!aiResponse || !aiResponse.data) {
        console.warn("AI response is missing 'data' field. Aborting.", { response: aiResponse });
        return;
    }

    const { target, payload } = aiResponse.data;

    // This is a legacy check for the old `talkToHuman` boolean.
    if (aiResponse.data.talkToHuman) {
        console.warn("Legacy `talkToHuman` boolean detected. The AI prompt should be updated to use `target: 'user-data'`.");
        updateUserData({ talkToHuman: true });
        return;
    }

    if (!target || !payload) {
        console.warn("AI response data is missing 'target' or 'payload'. Aborting.", { data: aiResponse.data });
        return;
    }

    switch (target) {
        case 'product-choice': {
            const currentState = getState();
            const mergedState = { ...currentState.productChoice, ...payload };
            updateProductChoice(mergedState);
            break;
        }
        case 'user-data':
            updateUserData(payload);
            break;

        default:
            console.error(`Unknown AI Target: '${target}'. The orchestrator does not know how to handle this. Update aborted.`, {
                target: target,
                payload: payload
            });
            break;
    }
}