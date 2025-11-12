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
        console.log(JSON.stringify({
            source: 'orchestrator.js',
            step: 'handleAiResponse-ignore',
            payload: { reason: "No data field in AI response", response: aiResponse }
        }));
        return;
    }

    const { target, payload } = aiResponse.data;

    if (aiResponse.data.talkToHuman) {
        console.log(JSON.stringify({
            source: 'orchestrator.js',
            step: 'handleAiResponse-process',
            payload: { talkToHuman: true }
        }));
        // Here you would add logic to escalate to a human agent
        return;
    }

    if (!target || !payload) {
        console.log(JSON.stringify({
            source: 'orchestrator.js',
            step: 'handleAiResponse-ignore',
            payload: { reason: "Missing target or payload in data", data: aiResponse.data }
        }));
        return;
    }

    console.log(JSON.stringify({
        source: 'orchestrator.js',
        step: 'handleAiResponse-process',
        payload: { target, payload }
    }));

    switch (target) {
        case 'product-choice':
            // The AI now returns the correct schema, so no translation is needed.
            // We merge the new payload with the existing state.
            const currentState = getState();
            const mergedState = { ...currentState, ...payload };
            updateProductChoice(mergedState);
            break;
        case 'user':
            // No translation needed for user data as schemas match
            updateUserData(payload);
            break;
        default:
            console.warn(JSON.stringify({
                source: 'orchestrator.js',
                step: 'handleAiResponse-warn',
                payload: { reason: `Unknown target: ${target}` }
            }));
            break;
    }
}
