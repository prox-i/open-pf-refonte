CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"contact_recipient_email" varchar(255),
	"public_email" varchar(255),
	"public_address" text,
	"public_hours" text,
	"facebook_url" text,
	"linkedin_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
