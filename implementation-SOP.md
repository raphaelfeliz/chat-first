# Implementation Standard Operating Procedure (SOP)

This document outlines the standard process used to investigate, plan, and execute new features in this project. The example used is the implementation of the "Proactive Chat Assistance" feature, where the product configurator's questions are automatically added to the chat UI.

---

## 1. Investigation Phase

The goal of this phase is to understand the existing codebase to determine the best approach for implementing the new feature with minimal disruption.

### 1.1. Information Required & File Investigation Plan

First, we identify the key questions that need to be answered and the files most likely to contain those answers.

*   **Template: `investigation-plan.md`**
    ```markdown
    # Investigation Plan: [Feature Name]

    ## Information Required

    1.  **Trigger Point:** Which file and function are responsible for the event that should trigger the new feature?
    2.  **Action Point:** Which file and function can perform the desired action (e.g., update the UI, call an API)?
    3.  **Connection Point:** How can the "Trigger" module communicate with the "Action" module? Is there an existing pattern (e.g., global state, direct import), or should a new one be created?

    ## File Investigation Plan

    Based on the information required, the following files must be analyzed:
    - `[path/to/trigger_file.js]`
    - `[path/to/action_file.js]`
    - `[path/to/central_hub_file.js]` (e.g., main.js, appState.js)
    ```

### 1.2. Investigation Result

After analyzing the files, the findings are summarized. This confirms our understanding and exposes any potential issues.

*   **Template: `investigation-result.md`**
    ```markdown
    # Investigation Result: [Feature Name]

    This document summarizes the findings of the investigation phase.

    ## 1. Key Function Analysis

    ### 1.1. `[path/to/trigger_file.js]`
    - The function `functionName()` in this file at line `XX` is the trigger point. It is responsible for [describe responsibility].

    ### 1.2. `[path/to/action_file.js]`
    - The function `functionName()` in this file can be used to perform the required action. It expects the following arguments: `[args]`.

    ## 2. Communication Pathway

    - A direct import between the modules is not ideal because it would create tight coupling.
    - The central hub, `main.js`, initializes both modules. Therefore, it is the ideal place to establish a communication channel using a decoupled event emitter pattern.

    ## 3. Conclusion
    The proposed implementation is feasible. The next step is to create a detailed execution plan.
    ```

---

## 2. Test-Driven Planning Phase

With a clear understanding of the codebase, we create a detailed, step-by-step plan. Each step is designed to be small, incremental, and, most importantly, verifiable with a "smoke test." The `top-level-plan.md` I created for this feature is a real-world example of this.

*   **Template: `feature-plan.md`**
    ```markdown
    # Feature Plan: [Feature Name]

    This document outlines the plan to implement [Feature Name].

    ---
    ## PHASE 1: [First Logical Step]
    - **Description:** [Brief description of the goal for this phase.]
    - **Status:** 🟡 Pending

    ### 1.1 [Action Item 1]
    - **File(s) Involved:** `[path/to/file.js]`

    ### 1.2 🚬 Smoke Test: [Test Description]
    - **Status:** 🟡 Pending
    - **Action:** [Specific action to perform, e.g., "Click the 'Submit' button."].
    - **Expected Outcome:** [Specific, verifiable outcome, e.g., "A 'submit-event' message should be logged to the console."].
    - **Log:**
      ```
      [Paste console logs here after execution]
      ```
    ---
    ## PHASE 2: [Second Logical Step]
    - ...
    ```

---

## 3. Execution & Verification Phase

This is the final phase where the plan is executed precisely as documented.

1.  **Implement Step 1.1:** Make the code changes described in the first phase of the plan.
2.  **Run Smoke Test 1.2:** Perform the action described in the smoke test.
3.  **Verify & Document:** Check if the outcome matches the expectation. Paste the relevant console logs or other outputs into the plan document (`feature-plan.md`). Mark the phase as complete (e.g., ✅ Complete).
4.  **Repeat:** Continue this process for all phases in the plan until the feature is fully implemented and verified.

By following this SOP, we ensure that new features are implemented in a structured, predictable, and verifiable manner, minimizing the risk of regressions and maintaining high code quality.
