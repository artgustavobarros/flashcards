CREATE TYPE "public"."review_kind" AS ENUM('rating', 'reset');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE "card_labels" (
	"card_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"label_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "card_labels_pkey" PRIMARY KEY("card_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"answer" jsonb NOT NULL,
	"answer_text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deck_id" uuid NOT NULL,
	"deleted_at" timestamp with time zone,
	"difficulty" double precision DEFAULT 0 NOT NULL,
	"due" date,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"last_reviewed_on" date,
	"new_queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"question" jsonb NOT NULL,
	"question_text" text NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"scheduled_days" integer DEFAULT 0 NOT NULL,
	"stability" double precision DEFAULT 0 NOT NULL,
	"state" smallint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "cards_id_user_id_key" UNIQUE("id","user_id"),
	CONSTRAINT "cards_state_check" CHECK ("cards"."state" between 0 and 3),
	CONSTRAINT "cards_due_check" CHECK (("cards"."state" = 0) = ("cards"."due" is null))
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"body" text NOT NULL,
	"card_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "decks_id_user_id_key" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "labels_id_user_id_key" UNIQUE("id","user_id")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"affects_schedule" boolean DEFAULT true NOT NULL,
	"card_id" uuid NOT NULL,
	"duration_ms" integer,
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"kind" "review_kind" NOT NULL,
	"prev_difficulty" double precision NOT NULL,
	"prev_due" date,
	"prev_lapses" integer NOT NULL,
	"prev_last_reviewed_on" date,
	"prev_reps" integer NOT NULL,
	"prev_scheduled_days" integer NOT NULL,
	"prev_stability" double precision NOT NULL,
	"prev_state" smallint NOT NULL,
	"rating" smallint,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_on" date NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "reviews_rating_check" CHECK (case "reviews"."kind" when 'rating' then "reviews"."rating" between 1 and 4 else "reviews"."rating" is null end)
);
--> statement-breakpoint
CREATE TABLE "user_days" (
	"bell_opened_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"day" date NOT NULL,
	"email_sent_at" timestamp with time zone,
	"seen_at" timestamp with time zone,
	"user_id" uuid NOT NULL,
	CONSTRAINT "user_days_pkey" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email_reminder" boolean DEFAULT true NOT NULL,
	"in_app_reminder" boolean DEFAULT true NOT NULL,
	"new_cards_paused" boolean DEFAULT false NOT NULL,
	"new_cards_per_day" smallint DEFAULT 20 NOT NULL,
	"review_time" time DEFAULT '19:00' NOT NULL,
	"theme" "theme" DEFAULT 'system' NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"timezone_auto" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid PRIMARY KEY NOT NULL,
	CONSTRAINT "user_settings_new_cards_per_day_check" CHECK ("user_settings"."new_cards_per_day" between 0 and 200)
);
--> statement-breakpoint
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_card_id_user_id_fkey" FOREIGN KEY ("card_id","user_id") REFERENCES "public"."cards"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_label_id_user_id_fkey" FOREIGN KEY ("label_id","user_id") REFERENCES "public"."labels"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_deck_id_user_id_fkey" FOREIGN KEY ("deck_id","user_id") REFERENCES "public"."decks"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_card_id_user_id_fkey" FOREIGN KEY ("card_id","user_id") REFERENCES "public"."cards"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_card_id_user_id_fkey" FOREIGN KEY ("card_id","user_id") REFERENCES "public"."cards"("id","user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_days" ADD CONSTRAINT "user_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "card_labels_label_id_idx" ON "card_labels" USING btree ("label_id");--> statement-breakpoint
CREATE INDEX "cards_deck_id_idx" ON "cards" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "cards_user_id_due_idx" ON "cards" USING btree ("user_id","due");--> statement-breakpoint
CREATE INDEX "cards_user_id_new_queued_at_idx" ON "cards" USING btree ("user_id","new_queued_at") WHERE "cards"."state" = 0;--> statement-breakpoint
CREATE INDEX "comments_card_id_created_at_idx" ON "comments" USING btree ("card_id","created_at");--> statement-breakpoint
CREATE INDEX "decks_user_id_idx" ON "decks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "labels_user_id_name_key_key" ON "labels" USING btree ("user_id","name_key") WHERE "labels"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "reviews_user_id_reviewed_at_idx" ON "reviews" USING btree ("user_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "reviews_card_id_reviewed_at_idx" ON "reviews" USING btree ("card_id","reviewed_at");--> statement-breakpoint
-- Hand-written: accounts created before this migration get their settings row too.
INSERT INTO "user_settings" ("user_id") SELECT "id" FROM "users" ON CONFLICT DO NOTHING;
