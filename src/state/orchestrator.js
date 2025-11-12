import { updateProductChoice, updateUserData } from './appState.js';

/**
 * @fileoverview Central orchestrator to process AI responses, translate schemas, and trigger state updates.
 */

/**
 * Translates the AI's product-choice payload to the frontend's state schema.
 * @param {object} aiPayload The payload from the AI's response.
 * @returns {object} The payload translated for the frontend state.
 */
function _translateProductChoice(aiPayload) {
    const frontendPayload = {};

    // Map fields from AI schema to frontend schema
    if (aiPayload.type)      frontendPayload.categoria = aiPayload.type;
    if (aiPayload.mechanism) frontendPayload.sistema = aiPayload.mechanism;
    if (aiPayload.shutter)   frontendPayload.persiana = aiPayload.shutter;
    if (aiPayload.motorized) frontendPayload.motorizada = aiPayload.motorized;
    if (aiPayload.material)  frontendPayload.material = aiPayload.material;
    if (aiPayload.leaves)    frontendPayload.folhas = String(aiPayload.leaves); // Convert number to string for state

    console.log(JSON.stringify({
        source: 'orchestrator.js',
        step: '_translateProductChoice',
        payload: { from: aiPayload, to: frontendPayload }
    }));

    return frontendPayload;
}

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
            const translatedPayload = _translateProductChoice(payload);
            updateProductChoice(translatedPayload);
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
