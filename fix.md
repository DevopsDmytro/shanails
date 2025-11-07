There is a critical error in the backend logs: 'column "telegramid" does not exist'. This indicates a persistent mismatch between the Prisma schema and a raw query.

Your task is to perform a full audit and fix this issue:
1.  Analyze `backend/prisma/schema.prisma` and ALL `.js` files in the `backend/` directory.
2.  Find every single place where the column is named `telegramId` and where it is being queried as `telegramid`.
3.  Standardize the name to `telegramId` (camelCase) ABSOLUTELY EVERYWHERE. This includes the schema, all API queries, and any initial data seeding scripts.
4.  After fixing the code, completely reset the database migrations. Delete the `backend/prisma/migrations` directory.
5.  Finally, generate a new, single migration that correctly reflects the updated schema by running `npx prisma migrate dev --name init`.
