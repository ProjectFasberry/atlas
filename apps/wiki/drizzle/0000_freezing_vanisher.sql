CREATE TABLE "wiki_images" (
	"id" text PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wiki_pages" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"html" text DEFAULT '' NOT NULL,
	"markdown" text DEFAULT '' NOT NULL,
	"section" text,
	"position" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'editor' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "wiki_revisions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "wiki_revisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"html" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author" text
);
--> statement-breakpoint
ALTER TABLE "wiki_revisions" ADD CONSTRAINT "wiki_revisions_slug_wiki_pages_slug_fk" FOREIGN KEY ("slug") REFERENCES "public"."wiki_pages"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wiki_pages_order_idx" ON "wiki_pages" USING btree ("position","slug");--> statement-breakpoint
CREATE INDEX "wiki_pages_section_idx" ON "wiki_pages" USING btree ("section","position");--> statement-breakpoint
CREATE INDEX "wiki_revisions_slug_idx" ON "wiki_revisions" USING btree ("slug","created_at");