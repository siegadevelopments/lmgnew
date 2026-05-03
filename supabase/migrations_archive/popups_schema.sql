-- Create popups table
CREATE TABLE IF NOT EXISTS public.popups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    cta_type TEXT DEFAULT 'url' CHECK (cta_type IN ('url', 'email')),
    cta_url TEXT,
    cta_button_text TEXT DEFAULT 'Click Here',
    is_active BOOLEAN DEFAULT false,
    display_delay INTEGER DEFAULT 3000, -- delay in ms
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

-- Admins can manage all popups
CREATE POLICY "Admins can manage popups" ON public.popups
    FOR ALL TO authenticated
    USING (public.is_admin());

-- Public can read active popups
CREATE POLICY "Public can read active popups" ON public.popups
    FOR SELECT TO public
    USING (is_active = true);
