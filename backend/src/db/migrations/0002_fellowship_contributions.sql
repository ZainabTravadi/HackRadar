-- Migration: add fellowship contribution ledger and difficulty enum
DO $$
BEGIN
  CREATE TYPE difficulty_enum AS ENUM ('easy', 'medium', 'hard', 'expert');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS fellowship_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository text NOT NULL,
  application_id uuid NOT NULL REFERENCES initiative_applications(id) ON DELETE CASCADE,
  github_username text NOT NULL,
  issue_number integer NOT NULL,
  linked_issue_numbers text[] NOT NULL DEFAULT ARRAY[]::text[],
  pr_number integer NOT NULL,
  pr_url text NOT NULL,
  difficulty difficulty_enum NOT NULL,
  points integer NOT NULL,
  additions integer NOT NULL DEFAULT 0,
  deletions integer NOT NULL DEFAULT 0,
  merged_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS fellowship_contributions_repository_pr_unique_idx
  ON fellowship_contributions(repository, pr_number);
CREATE INDEX IF NOT EXISTS fellowship_contributions_application_idx
  ON fellowship_contributions(application_id);
CREATE INDEX IF NOT EXISTS fellowship_contributions_github_username_idx
  ON fellowship_contributions(github_username);
CREATE INDEX IF NOT EXISTS fellowship_contributions_difficulty_idx
  ON fellowship_contributions(difficulty);
CREATE INDEX IF NOT EXISTS fellowship_contributions_merged_at_idx
  ON fellowship_contributions(merged_at);
