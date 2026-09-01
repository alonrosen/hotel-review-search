# Branching Strategy Rule

**CRITICAL GUIDELINE FOR FUTURE AGENTS:**

If you are currently on the `main` branch (or any default production branch) and are preparing to `git commit` or `git push` changes:

1. **STOP.** Do **NOT** commit directly to `main` unless you have explicitly asked the user for permission and they approved it.
2. If you have not asked, you **MUST** ask the user whether they want you to create a new branch for the changes, or if they want you to commit directly to `main`.
3. If creating a new branch, use standard naming conventions (e.g. `feature/name`, `bugfix/name`, `security/name`).

Always prioritize using pull requests via new branches over direct commits to `main`.
