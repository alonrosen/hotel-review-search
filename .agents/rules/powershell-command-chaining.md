# PowerShell Git Commit Chaining

**CRITICAL GUIDELINE FOR FUTURE AGENTS:**

When operating on a Windows machine using PowerShell (`run_command`), do **NOT** use `&&` to chain multiple commands (like `git add . && git commit ... && git push`).

The `&&` token is not a valid statement separator in PowerShell (prior to PowerShell 7, and even then it can be problematic depending on the specific environment setup). 

Instead, use one of the following approaches:

### Approach 1: Semicolon separator (Recommended for chaining)
Use `;` to chain commands sequentially in a single `run_command` call.

```powershell
git add . ; git commit -m "Your commit message" ; git push
```

### Approach 2: Execute sequentially
For maximum reliability, you can just run them as sequential tool calls, or separated by a newline in the `run_command` string block if the tool supports multiline scripts:

```powershell
git add .
git commit -m "Your commit message"
git push
```

Always use `;` instead of `&&` when chaining commands in Windows PowerShell environments.
