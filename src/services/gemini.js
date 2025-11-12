/**
 * A simple placeholder for getting an AI response.
 * In a real application, this would make a call to a Gemini model.
 * @param {string} userInput The text from the user.
 * @returns {Promise<string>} A promise that resolves to the AI's response.
 */
export async function getAiResponse(userInput) {
  console.log(`Received input for AI: ${userInput}`);

  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simple, rule-based responses for demonstration
  if (userInput.toLowerCase().includes("hello")) {
    return "Hi there! How can I help you configure your product today?";
  }
  if (userInput.toLowerCase().includes("help")) {
    return "You can select options from the left panel or ask me questions directly.";
  }
  if (userInput.toLowerCase().includes("option")) {
    return "The available options are displayed on the left. Let me know which one you're interested in.";
  }

  return "I'm not sure how to respond to that. Try asking about product options.";
}
