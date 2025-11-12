# Bug Report & Recovery Plan (2024-07-16)

## 1. Overview

The end-to-end smoke test for the "Multi-Step & Proactive Handoff" feature has failed catastrophically. The test revealed multiple critical flaws in the AI logic, backend error handling, and overall state management, leading to a backend crash and a complete breakdown of the user journey. This document outlines the identified bugs and a new, granular, test-driven recovery plan.

---

## 2. Detailed Error Analysis

*   **Bug #1: CRITICAL - AI Backend Crash (500 Internal Server Error):** The backend crashed when handling a conversational reply to a direct question during the handoff flow.
*   **Bug #2: MAJOR - Proactive Data Capture Failure:** The AI failed to extract the user's name and handoff intent from the same sentence.
*   **Bug #3: MAJOR - Flawed Handoff State Logic:** The entire concept of a separate, brittle AI prompt for the handoff flow was a fundamental design flaw.
*   **Bug #4: MINOR - Redundant UI Questions:** The product configurator UI asks repetitive and distracting questions that are out of sync with the main AI conversation.

---

## 3. Recovery Plan

This plan will be executed in small, verifiable phases, with a smoke test at each step.

### PHASE 1: Silence the Redundant UI

- **Problem:** The `configuratorEngine` runs its own logic to determine the next product question and injects it into the chat. This creates a confusing user experience where two different "AIs" appear to be speaking at once, often out of sync with the user's actual conversation.
- **Approach:** The main Gemini-powered AI should be the single driver of the conversation. I will disable the configurator's ability to directly inject questions into the chat. This makes the main AI the sole, authoritative voice of the assistant, simplifying the user experience and eliminating distracting, irrelevant questions.
- **Status:** 🟡 Pending

#### 1.1 Action: Disable the `facetQuestionUpdated` Event

- **File(s) Involved:** `src/configurator/configuratorEngine.js`
- **Change:** I will locate the `events.emit('facetQuestionUpdated', ...)` line and comment it out.

#### 1.2 🚬 Smoke Test: Basic AI Interaction
- **Status:** 🟡 Pending
- **Action:** 1. Hard refresh the app. 2. In the chat, type `janela` and press Enter.
- **Expected Outcome:** The AI should respond in the chat. The console **should not** contain any `facetQuestionUpdated` event logs. The UI on the left might update based on the state change, but no new AI questions should appear in the chat bubble area from the configurator.

---

### PHASE 2: Unify the AI Brain

- **Problem:** The application currently has a "split brain." It uses a smart, context-aware AI for general chat, but it "hijacks" the conversation during the handoff flow to use a second, simplistic and context-free AI process. This flawed design is the root cause of the backend crash (Bug #1) because the simple AI cannot handle normal, conversational replies.
- **Approach:** I will perform surgery to remove the second, flawed brain. I will eliminate the hijack mechanism entirely, ensuring that *all* user input is processed by the single, main, context-aware AI. This unifies the logic, makes the system resilient to natural conversation, and is the most critical step to making the handoff process robust.
- **Status:** 🟡 Pending

#### 2.1 Action: Remove Handoff Hijack Logic
- **File(s) Involved:** `src/state/orchestrator.js`, `src/chat/chatUi.js`
- **Change:** 
  1. Delete the `handleHandoffInput` function from `orchestrator.js`.
  2. Remove the `if (getHandoffState() !== null)` block from `chatUi.js`.

#### 2.2 🚬 Smoke Test: Ensure Core AI Still Responds
- **Status:** 🟡 Pending
- **Action:** 1. Hard refresh the app. 2. Type `Qual o prazo de entrega?` and press Enter.
- **Expected Outcome:** The app should not crash. The main AI should receive the message and give a normal, conversational response. This test proves that the core chat loop is still functional after removing the flawed handoff logic.

---

### PHASE 3: Strengthen the Core AI Prompt

- **Problem:** Now that the unified AI brain is responsible for all tasks, it needs better instructions. In the failed test, it missed the user's name ("meu nome é carlos") when it was part of a larger request to talk to an agent. This is a failure of the AI's core instructions (its system prompt).
- **Approach:** I will rewrite the AI's "constitution" – the system prompt in `main.py`. The new prompt will give the model a strict, explicit order of operations to follow for every message: 1) First, *always* scan the input for user data like name, email, or phone. 2) Second, determine the user's primary intent (e.g., asking a question, choosing a product, requesting a handoff). 3) Third, formulate a response. This will fix the proactive data capture failure (Bug #2).
- **Status:** 🟡 Pending

#### 3.1 Action: Enhance the System Prompt
- **File(s) Involved:** `main.py`
- **Change:** I will read and then rewrite the system prompt with a more robust, multi-step instruction set.

#### 3.2 🚬 Smoke Test: Proactive Handoff Trigger
- **Status:** 🟡 Pending
- **Action:** 1. Hard refresh the app. 2. Type `meu nome é Carlos. quero falar com um vendedor.` and press Enter.
- **Expected Outcome:** The AI must perform two actions at once: 1) Capture the name "Carlos" and update the state. 2) Immediately ask for the next piece of information. The correct response should be something like, "Obrigado, Carlos. Qual é o seu e-mail ou telefone?". The console should show the state updating with `userName: "Carlos"` and `handoffState: "needs_contact"`.

---

### PHASE 4: Full End-to-End Verification

- **Problem:** The previous phases fixed individual bugs in isolation. We need to ensure that all fixes work together to create the seamless, intelligent, and error-free user journey that was the original goal.
- **Approach:** This is the final exam. I will execute the complete, multi-step user story from the `blueprint.md`. This test simulates a realistic conversation from start to finish. Its success will be the ultimate proof that the application is now stable, robust, and functions as designed.
- **Status:** 🟡 Pending

#### 4.1 🚬 Smoke Test: The Full User Journey
- **Status:** 🟡 Pending
- **Action:** Execute the following conversation flow precisely:
  1. Hard Refresh.
  2. `Meu nome é Carlos.`
  3. `Eu quero uma porta de 4 folhas.`
  4. `Quero falar com um vendedor.`
  5. `meu email é carlos@test.com`
  6. `Qual o prazo de entrega?`
- **Expected Outcome:** The conversation must proceed without any errors, crashes, or incorrect state changes. The AI must correctly identify the user's name and email, trigger the handoff at the appropriate time, display the final WhatsApp link, and then—most importantly—continue the conversation normally when asked the final question. The entire process should feel natural and intelligent.
