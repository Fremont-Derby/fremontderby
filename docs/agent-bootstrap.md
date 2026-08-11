# External Agent Bootstrap

Use this as the minimal prompt for a scheduled ChatGPT task or any low-context external development session:

```text
Continue autonomous development of https://github.com/subiki/fremontderby.

Start from current repository state, not prior session memory. Read README.md and AGENTS.md on current main and follow those instructions. Reconcile current issues, PRs, CI, and any relevant live platform state; choose the highest-impact safe unblocked work; implement, test, document, maintain the backlog, and merge safe green changes under standing authorization. Capture durable lessons back into the repository instructions when they will improve future sessions. End with the repository and issue state current and one clear next target.
```

## Why this prompt stays small

The external scheduler should only know how to find the repository and bootstrap itself. Current priorities, product rules, architecture, environment details, test commands, and feature-specific context belong in the repository and GitHub issues where they can evolve without editing every scheduled task.

When this bootstrap can be made materially clearer or more robust, update this file. Avoid adding temporary blockers, issue numbers, current release status, or implementation detail here.
