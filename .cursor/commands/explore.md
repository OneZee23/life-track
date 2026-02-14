You've just received business or technical requirements for a feature.
Now you cannot proceed to implementation as your codebase understanding is incomplete.

**THE TASK:** Your current task is to explore the codebase, gather all context needed to implement the feature.

**THE GOAL:** Build a complete mental model of the requested functionality, covering:
- Data structures: Models, DTOs, interfaces
- Control flow: ViewModels, Services, their interactions
- UI components: Views, reusable components, navigation
- State management: reactive patterns, data flow
- External dependencies: network clients, storage, 3rd party services
- Business rules: validation, transformations, error cases
- Entry/exit points: Views, ViewModels, Coordinators, navigation flows
- Offline support: local storage, sync logic, conflict resolution


**ITERATION ALGORITHM:**

1. **Explore Phase** (Use parallel tool calls for efficiency)
   1.1. Read 5-10 most relevant files (parallel reads when possible)
   1.2. Find 2-3 similar feature implementations as templates
   1.3. Fetch applicable workspace rules (mobile, architecture, state management, etc.)
   1.4. Identify patterns: naming conventions, file structure, architectural patterns (MVVM, Coordinator)
   1.5. Understand navigation flow and state management approach

2. **Self-Check** (Can you answer these WITHOUT "I assume..." or "probably..."?)
   - ✓ What Models/DTOs/interfaces are needed? (exact types for your platform)
   - ✓ Which ViewModels/Services handle orchestration? (class names, patterns)
   - ✓ What Views and UI components are needed? (existing components to reuse)
   - ✓ How does navigation work? (Coordinator pattern, routing)
   - ✓ What are the error/edge cases? (validation, exceptions, offline scenarios)
   - ✓ Which existing patterns match this feature? (file references)
   - ✓ What external integrations are needed? (network, storage, 3rd parties)
   - ✓ How does offline-first work? (local storage, sync strategy)
   - ✓ What state management approach is used? (ObservableObject, StateNotifier, hooks)
   
   2.1. **If all checkboxes clear:** → Go to Step 4 (Report)
   2.2. **If unknowns remain:** → Reduce uncertainty
        2.2.1. If resolvable via codebase → Go back to Step 1
        2.2.2. If specific to current feature → Go to Step 3

3. **Clarification Request**
   3.1. List specific, concrete unknowns (not "how does X work?" but "Does X use polling or push notifications?")
   3.2. Provide context for each unknown with short heading and details
   3.3. **STOP HERE.** Finish your turn. Wait for user response before continuing.

4. **Report Mental Model**
   4.1. Describe components, dataflow, and interactions with specific file/class references
   4.2. Reference existing patterns and workspace rules you'll follow
   4.3. Explain how the feature fits into the existing architecture
   4.4. Describe user flow: View → ViewModel → Service → Model → Storage/Network
   4.5. Explain offline-first approach and sync strategy
   4.6. **STOP HERE.** Finish your turn. Wait for implementation approval.


**IMPORTANT CONSIDERATIONS:**
- Don't stop iterating until ALL blind spots are resolved
- Don't proceed to implementing until user explicitly approves
- Use parallel tool calls to explore efficiently (read multiple files at once)
- Stop when you can explain the implementation without guessing
- Pay special attention to offline-first patterns and state management