Your current task is to document things you've learned in this session.
Follow protocol below.

# DOCUMENTING PROTOCOL

## What to document

Document conventions, approaches, patterns and constraints which:
- Are beyond common AI/developer knowledge
- Are not documented in project rules yet
- Cannot be validated easily by running a test or a linter
- Belong to one of codebase aspects in common, NOT to a specific business domain or feature

BAD THINGS TO DOCUMENT (NEVER DO IT):
- How to import files in Swift/TypeScript (general knowledge)
- Which specific ViewModel handles login (scoped knowledge, not reusable)
- How do we call specific API endpoint (scoped, narrow thing)

GOOD THINGS TO DOCUMENT:
- How do we organize cross-feature navigation and coordination
- How do we structure offline-first data synchronization
- How do we handle platform-specific UI adaptations
- How do we organize shared state management across features


## How do document

Our rules are modular. They live in separate files named after the aspect they cover (e.g., `mobile.mdc`, `architecture.mdc`). Always identify and edit the specific rule file. Avoid making changes to general rules unless the rule is truly global.

1. Read rule file you elaborating on: `.cursor/rules/[aspect].mdc`
2. Find the most appropriate place for documenting, cohesive depending on concerns described
3. Change existing paragraph or add another one, effectively capturing the concern.
4. Reinforce rules you impose, adding a double-check bullet to `.cursor/commands/review.md`


## Documenting

When making changes to rule files, strictly follow principles below:
- Prefer positive instructions (DO) instead of negative (DON'T)
- Prefer actionable instructions (if this, then do this) instead of declarative
- Be maximally concise as much as you can, avoid explanations


## Reinforcing the rules

This project contains code review protocol for AI, stored in `.cursor/commands/review.md`. To reinforce following of a specific rule, condense the rule into a concise checklist bullet and integrate in naturally in `review.md`.


**SINCE THIS PROJECT IS BEING DEVELOPED WITH AI-FIRST APPROACH, PROPER RULES DOCUMENTING IS CRUCIAL. TRY YOUR BEST.**
