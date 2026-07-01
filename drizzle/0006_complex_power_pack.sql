ALTER TABLE "agenda_events" ADD COLUMN "slug" varchar(200);--> statement-breakpoint
ALTER TABLE "agenda_events" ADD COLUMN "content" text;--> statement-breakpoint
UPDATE "agenda_events" SET "slug" = left(regexp_replace(lower("title"), '[^a-z0-9]+', '-', 'g'), 40) || '-' || left(replace("id"::text, '-', ''), 6) WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "agenda_events" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_slug_unique" UNIQUE("slug");
