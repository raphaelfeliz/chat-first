/**
 * Gets an AI response from the Gemini Cloud Function.
 * @param {string} userInput The text from the user.
 * @returns {Promise<object>} A promise that resolves to the AI's full JSON response.
 */
export async function getAiResponse(userInput) {
  const GEMINI_ENDPOINT = 'https://gemini-endpoint-yf2trly67a-uc.a.run.app/';
  console.log(JSON.stringify({
    source: 'gemini.js',
    step: 'request',
    payload: {
      endpoint: GEMINI_ENDPOINT,
      prompt: userInput
    }
  }));

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: userInput }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(JSON.stringify({
        source: 'gemini.js',
        step: 'response-error',
        payload: {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        }
      }));
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(JSON.stringify({
        source: 'gemini.js',
        step: 'response-success',
        payload: data
    }));
    
    return data;

  } catch (error) {
    console.error(JSON.stringify({
        source: 'gemini.js',
        step: 'fetch-error',
        payload: {
            message: error.message,
            stack: error.stack
        }
    }));
    // Return a structured error object that mimics the expected success response
    return {
      status: 'error',
      message: 'Sorry, I was unable to connect to the AI service. Please try again later.',
      data: null
    };
  }
}
