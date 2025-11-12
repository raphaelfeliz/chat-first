/*
path: src/services/gemini.js
purpose: Client-side service to communicate with the backend AI (Google Cloud Function).
summary: This module is responsible for sending the user's natural language input along with their current product configuration choices to the secure, serverless Gemini endpoint. It handles the network request (`fetch`), logs the request details (including a curl equivalent for debugging), validates the HTTP response, and parses the structured JSON returned by the AI. It includes robust error handling to log network or API errors and returns a friendly fallback message if the connection fails.
imports:
functions:
(export) getAiResponse: summary: Asynchronously sends a POST request with the user's prompt and current state to the Gemini Cloud Function and returns the structured AI response or a fallback error object.
*/
/**
 * Gets an AI response from the Gemini Cloud Function.
 * @param {string} userInput The text from the user.
 * @param {object} productChoice The user's current product selections.
 * @returns {Promise<object>} A promise that resolves to the AI's full JSON response.
 */
export async function getAiResponse(userInput, productChoice) {
  // New log to inspect the raw arguments passed to this function
  console.log(JSON.stringify({
      level: 'DEBUG',
      source: 'gemini.js',
      step: 'getAiResponse-arguments-start',
      message: 'Received arguments for AI request generation.',
      payload: {
          userInputLength: userInput.length,
          productChoiceKeys: Object.keys(productChoice)
      }
  }));

  const GEMINI_ENDPOINT = 'https://gemini-endpoint-yf2trly67a-uc.a.run.app/';
  
  const requestBody = { prompt: userInput, productChoice };
  // Create a concise curl equivalent for easy debugging/reproduction
  const curlEquivalent = `curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify(requestBody)}' ${GEMINI_ENDPOINT}`;

  console.log(JSON.stringify({
      level: 'INFO',
      source: 'gemini.js',
      step: 'request-details',
      message: 'Sending structured request to Gemini Cloud Function endpoint.',
      payload: {
          endpoint: GEMINI_ENDPOINT,
          promptSnippet: userInput.substring(0, 50) + '...',
          productChoiceKeys: Object.keys(productChoice),
          curlEquivalent
      }
  }));

  try {
      const response = await fetch(GEMINI_ENDPOINT, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.log(JSON.stringify({
              level: 'ERROR',
              source: 'gemini.js',
              step: 'response-http-error',
              message: 'HTTP response failed (status not OK).',
              payload: {
                  status: response.status,
                  statusText: response.statusText,
                  bodySnippet: errorText.substring(0, 100)
              }
          }));
          // Throw a specific error to be caught by the outer catch block
          throw new Error(`Cloud Function returned a non-OK status: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(JSON.stringify({
          level: 'INFO',
          source: 'gemini.js',
          step: 'response-success',
          message: 'Successfully received and parsed structured JSON response from AI.',
          payload: {
              status: data.status,
              target: data.data ? data.data.target : 'N/A',
              messageSnippet: data.message ? data.message.substring(0, 50) + '...' : 'N/A'
          }
      }));
      
      return data;

  } catch (error) {
      console.log(JSON.stringify({
          level: 'FATAL',
          source: 'gemini.js',
          step: 'fetch-exception',
          message: 'Critical error during fetch operation (network error or JSON parse failure).',
          payload: {
              errorName: error.name,
              errorMessage: error.message,
              endpoint: GEMINI_ENDPOINT
          }
      }));
      // Return a structured error object that mimics the expected success response
      // so the UI can process a friendly error message without crashing.
      return {
          status: 'error',
          message: 'Sorry, I was unable to connect to the AI service. Please check your network connection or try again later.',
          data: null
      };
  }
}