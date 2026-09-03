CREATE TABLE IF NOT EXISTS public.marketing_plan_state (
    id TEXT PRIMARY KEY,
    state JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.marketing_plan_state ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DROP POLICY IF EXISTS "Allow public read access to marketing_plan_state" ON public.marketing_plan_state;
CREATE POLICY "Allow public read access to marketing_plan_state"
    ON public.marketing_plan_state
    FOR SELECT
    USING (true);

-- Allow full write access
DROP POLICY IF EXISTS "Allow write access to marketing_plan_state" ON public.marketing_plan_state;
CREATE POLICY "Allow write access to marketing_plan_state"
    ON public.marketing_plan_state
    FOR ALL
    USING (true)
    WITH CHECK (true);
