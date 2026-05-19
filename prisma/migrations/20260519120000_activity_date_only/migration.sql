-- Store activity and suggestion dates as calendar dates (no time component).
ALTER TABLE "Activity" ALTER COLUMN "date" SET DATA TYPE DATE USING ("date" AT TIME ZONE 'UTC')::date;
ALTER TABLE "Suggestion" ALTER COLUMN "date" SET DATA TYPE DATE USING ("date" AT TIME ZONE 'UTC')::date;
