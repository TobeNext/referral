# MainOrchestrator

Purpose: run one task through Planner, Coder, Reviewer, ConstraintVerifier, and Maintainer, in that order.

Protocol:
- Load only the current role file and its required references.
- Pass the task, plan, changed files, evidence, and any `Update:` section forward.
- Execute roles serially when separate agents are unavailable.
- Stop when Reviewer emits an implementation `Update:` or required constraints fail.
