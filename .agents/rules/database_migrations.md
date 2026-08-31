# Database Migrations Rule

When modifying the Prisma schema (`prisma/schema.prisma`), you **MUST** create a database migration file. 

**NEVER** use `npx prisma db push` as a substitute for migrations when working on features that will be deployed to production. Using `db push` without a migration file will cause production deployments to break, as Vercel runs `prisma migrate deploy` which relies exclusively on the `prisma/migrations` folder.

## Workflow for Database Changes:
1. Modify `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <descriptive_name>` to generate a new migration file.
   - *Note: If you are making schema changes and don't want to reset the local database, you can still use `prisma migrate dev --create-only` or use `prisma migrate diff` to generate the SQL manually, but a migration file MUST exist.*
3. Commit both the `schema.prisma` and the newly generated `prisma/migrations/<timestamp>_<name>/migration.sql` files.
4. Push to the repository.

This ensures that the production database schema is correctly updated during deployment.
