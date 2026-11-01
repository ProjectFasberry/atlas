CREATE TABLE "wiki_page_translations" (
	"slug" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"html" text NOT NULL,
	"markdown" text DEFAULT '' NOT NULL,
	"source_hash" text NOT NULL,
	"engine" text DEFAULT 'deepl' NOT NULL,
	"translated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_page_translations_slug_locale_pk" PRIMARY KEY("slug","locale")
);
--> statement-breakpoint
ALTER TABLE "wiki_page_translations" ADD CONSTRAINT "wiki_page_translations_slug_wiki_pages_slug_fk" FOREIGN KEY ("slug") REFERENCES "public"."wiki_pages"("slug") ON DELETE cascade ON UPDATE no action;