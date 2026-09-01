# Verify Build Before Commit/Push

**CRITICAL GUIDELINE FOR FUTURE AGENTS:**

Before committing or pushing any code to the repository (especially in Next.js or TypeScript projects), you **MUST** ensure that the project compiles and passes all TypeScript checks. 

Vercel preview builds will fail if there are any TypeScript or compilation errors. To ensure the preview build passes on the first go:

1. Always run `npm run build` (or the equivalent build command) to verify compilation.
2. Fix any TypeScript errors, missing imports, or type mismatches that arise.
3. Only `git commit` and `git push` once the build is 100% successful.

Never push untested or uncompiled code!
