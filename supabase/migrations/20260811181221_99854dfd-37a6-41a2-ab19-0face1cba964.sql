-- Add icon_url and cover_url to study_groups if they don't exist
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE public.study_groups ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Seed some groups if needed or ensure existing ones have defaults if null
UPDATE public.study_groups SET icon_url = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=128&h=128&fit=crop' WHERE icon_url IS NULL;
UPDATE public.study_groups SET cover_url = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=400&fit=crop' WHERE cover_url IS NULL;
