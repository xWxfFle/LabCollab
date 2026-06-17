CREATE TYPE "public"."experiment_template_scope" AS ENUM('user', 'project');--> statement-breakpoint
CREATE TABLE "experiment_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"scope" "experiment_template_scope" NOT NULL,
	"user_id" uuid,
	"project_id" uuid,
	"field_definitions" jsonb NOT NULL,
	"default_observations" text,
	"default_checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "experiment_templates" ADD CONSTRAINT "experiment_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiment_templates" ADD CONSTRAINT "experiment_templates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "field_definitions" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "field_values" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "experiments" ADD COLUMN "checklist" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_template_id_experiment_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."experiment_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE TYPE "public"."experiment_status_new" AS ENUM('draft', 'in_progress', 'completed_success', 'completed_failure');--> statement-breakpoint
ALTER TABLE "experiments" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "experiments" ALTER COLUMN "status" TYPE "experiment_status_new" USING (
  CASE "status"::text
    WHEN 'completed' THEN 'completed_success'::"experiment_status_new"
    ELSE "status"::text::"experiment_status_new"
  END
);--> statement-breakpoint
ALTER TABLE "experiments" ALTER COLUMN "status" SET DEFAULT 'draft'::"experiment_status_new";--> statement-breakpoint
DROP TYPE "public"."experiment_status";--> statement-breakpoint
ALTER TYPE "public"."experiment_status_new" RENAME TO "experiment_status";--> statement-breakpoint
DO $$
DECLARE
  r RECORD;
  defs jsonb := '[]'::jsonb;
  vals jsonb := '{}'::jsonb;
  field_id uuid;
  ord int;
BEGIN
  FOR r IN SELECT * FROM experiments LOOP
    defs := '[]'::jsonb;
    vals := '{}'::jsonb;
    ord := 0;

    IF r.objective IS NOT NULL AND r.objective <> '' THEN
      field_id := gen_random_uuid();
      defs := defs || jsonb_build_array(jsonb_build_object(
        'id', field_id::text,
        'label', 'Цель',
        'required', true,
        'order', ord
      ));
      vals := vals || jsonb_build_object(field_id::text, r.objective);
      ord := ord + 1;
    END IF;

    IF r.hypothesis IS NOT NULL AND r.hypothesis <> '' THEN
      field_id := gen_random_uuid();
      defs := defs || jsonb_build_array(jsonb_build_object(
        'id', field_id::text,
        'label', 'Гипотеза',
        'required', false,
        'order', ord
      ));
      vals := vals || jsonb_build_object(field_id::text, r.hypothesis);
      ord := ord + 1;
    END IF;

    IF r.materials IS NOT NULL AND r.materials <> '' THEN
      field_id := gen_random_uuid();
      defs := defs || jsonb_build_array(jsonb_build_object(
        'id', field_id::text,
        'label', 'Материалы',
        'required', false,
        'order', ord
      ));
      vals := vals || jsonb_build_object(field_id::text, r.materials);
      ord := ord + 1;
    END IF;

    IF r.protocol_steps IS NOT NULL AND r.protocol_steps <> '' THEN
      field_id := gen_random_uuid();
      defs := defs || jsonb_build_array(jsonb_build_object(
        'id', field_id::text,
        'label', 'Протокол',
        'required', false,
        'order', ord
      ));
      vals := vals || jsonb_build_object(field_id::text, r.protocol_steps);
      ord := ord + 1;
    END IF;

    IF r.conditions IS NOT NULL AND r.conditions <> '' THEN
      field_id := gen_random_uuid();
      defs := defs || jsonb_build_array(jsonb_build_object(
        'id', field_id::text,
        'label', 'Условия',
        'required', false,
        'order', ord
      ));
      vals := vals || jsonb_build_object(field_id::text, r.conditions);
      ord := ord + 1;
    END IF;

    IF r.results IS NOT NULL AND r.results <> '' THEN
      field_id := gen_random_uuid();
      defs := defs || jsonb_build_array(jsonb_build_object(
        'id', field_id::text,
        'label', 'Результаты',
        'required', false,
        'order', ord
      ));
      vals := vals || jsonb_build_object(field_id::text, r.results);
    END IF;

    IF jsonb_array_length(defs) = 0 THEN
      field_id := gen_random_uuid();
      defs := jsonb_build_array(jsonb_build_object(
        'id', field_id::text,
        'label', 'Цель',
        'required', true,
        'order', 0
      ));
      vals := jsonb_build_object(field_id::text, COALESCE(r.objective, ''));
    END IF;

    UPDATE experiments
    SET field_definitions = defs,
        field_values = vals,
        checklist = '[]'::jsonb
    WHERE id = r.id;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "experiments" DROP COLUMN "hypothesis";--> statement-breakpoint
ALTER TABLE "experiments" DROP COLUMN "objective";--> statement-breakpoint
ALTER TABLE "experiments" DROP COLUMN "materials";--> statement-breakpoint
ALTER TABLE "experiments" DROP COLUMN "protocol_steps";--> statement-breakpoint
ALTER TABLE "experiments" DROP COLUMN "conditions";--> statement-breakpoint
ALTER TABLE "experiments" DROP COLUMN "results";
