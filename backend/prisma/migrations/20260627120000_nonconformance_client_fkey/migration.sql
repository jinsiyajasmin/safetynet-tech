-- Enforce referential integrity for NonconformanceAction.clientId (was indexed only).

DELETE FROM "NonconformanceAction" AS na
WHERE NOT EXISTS (
  SELECT 1 FROM "Client" AS c WHERE c."id" = na."clientId"
);

ALTER TABLE "NonconformanceAction" ADD CONSTRAINT "NonconformanceAction_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
