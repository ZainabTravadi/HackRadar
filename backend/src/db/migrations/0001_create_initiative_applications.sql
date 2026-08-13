-- Migration: create initiative_applications
CREATE TABLE IF NOT EXISTS initiative_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  github_username text,
  linkedin_url text,
  website_url text,
  interests text[] NOT NULL DEFAULT ARRAY[]::text[],
  contribution_areas text[] NOT NULL DEFAULT ARRAY[]::text[],
  experience_level text,
  availability text,
  contribution_types text[] NOT NULL DEFAULT ARRAY[]::text[],
  motivation text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS initiative_applications_created_at_idx ON initiative_applications(created_at);
