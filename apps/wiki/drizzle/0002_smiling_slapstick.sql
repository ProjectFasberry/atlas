CREATE TABLE "wiki_section_translations" (
	"section" text NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"translated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wiki_section_translations_section_locale_pk" PRIMARY KEY("section","locale")
);
