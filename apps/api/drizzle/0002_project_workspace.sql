CREATE TYPE "public"."project_node_type" AS ENUM('folder', 'page', 'experiment');--> statement-breakpoint
CREATE TABLE "project_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"parent_id" uuid,
	"node_type" "project_node_type" NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"experiment_id" uuid,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_nodes_experiment_id_unique" UNIQUE("experiment_id")
);
--> statement-breakpoint
CREATE TABLE "project_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"body_html" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_pages_node_id_unique" UNIQUE("node_id")
);
--> statement-breakpoint
ALTER TABLE "project_nodes" ADD CONSTRAINT "project_nodes_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_nodes" ADD CONSTRAINT "project_nodes_parent_id_project_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."project_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_nodes" ADD CONSTRAINT "project_nodes_experiment_id_experiments_id_fk" FOREIGN KEY ("experiment_id") REFERENCES "public"."experiments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_nodes" ADD CONSTRAINT "project_nodes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_pages" ADD CONSTRAINT "project_pages_node_id_project_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."project_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_pages" ADD CONSTRAINT "project_pages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "project_nodes" ("project_id", "parent_id", "node_type", "title", "sort_order", "experiment_id", "author_id", "created_at", "updated_at")
SELECT
  e."project_id",
  NULL,
  'experiment'::"project_node_type",
  e."title",
  (ROW_NUMBER() OVER (PARTITION BY e."project_id" ORDER BY e."created_at") - 1)::integer,
  e."id",
  e."author_id",
  e."created_at",
  e."updated_at"
FROM "experiments" e
WHERE NOT EXISTS (
  SELECT 1 FROM "project_nodes" pn WHERE pn."experiment_id" = e."id"
);