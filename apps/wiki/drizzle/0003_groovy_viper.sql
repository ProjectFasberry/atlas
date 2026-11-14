ALTER TABLE "wiki_page_translations" DROP CONSTRAINT "wiki_page_translations_slug_wiki_pages_slug_fk";
--> statement-breakpoint
ALTER TABLE "wiki_revisions" DROP CONSTRAINT "wiki_revisions_slug_wiki_pages_slug_fk";
--> statement-breakpoint
DROP INDEX "wiki_pages_order_idx";--> statement-breakpoint
DROP INDEX "wiki_pages_section_idx";--> statement-breakpoint
DROP INDEX "wiki_revisions_slug_idx";--> statement-breakpoint
ALTER TABLE "wiki_page_translations" DROP CONSTRAINT "wiki_page_translations_slug_locale_pk";--> statement-breakpoint
ALTER TABLE "wiki_pages" DROP CONSTRAINT "wiki_pages_pkey";--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD COLUMN "server" text DEFAULT 'bisquite' NOT NULL;--> statement-breakpoint
ALTER TABLE "wiki_page_translations" ADD COLUMN "server" text DEFAULT 'bisquite' NOT NULL;--> statement-breakpoint
ALTER TABLE "wiki_revisions" ADD COLUMN "server" text DEFAULT 'bisquite' NOT NULL;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_server_slug_pk" PRIMARY KEY("server","slug");--> statement-breakpoint
ALTER TABLE "wiki_page_translations" ADD CONSTRAINT "wiki_page_translations_server_slug_locale_pk" PRIMARY KEY("server","slug","locale");--> statement-breakpoint
ALTER TABLE "wiki_page_translations" ADD CONSTRAINT "wiki_page_translations_server_slug_wiki_pages_server_slug_fk" FOREIGN KEY ("server","slug") REFERENCES "public"."wiki_pages"("server","slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wiki_revisions" ADD CONSTRAINT "wiki_revisions_server_slug_wiki_pages_server_slug_fk" FOREIGN KEY ("server","slug") REFERENCES "public"."wiki_pages"("server","slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wiki_pages_order_idx" ON "wiki_pages" USING btree ("server","position","slug");--> statement-breakpoint
CREATE INDEX "wiki_pages_section_idx" ON "wiki_pages" USING btree ("server","section","position");--> statement-breakpoint
CREATE INDEX "wiki_revisions_slug_idx" ON "wiki_revisions" USING btree ("server","slug","created_at");
