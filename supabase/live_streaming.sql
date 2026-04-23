-- 1. Create Vendor Streams table
CREATE TABLE IF NOT EXISTS public.vendor_streams (
  vendor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  mux_stream_id TEXT,
  mux_stream_key TEXT,
  mux_playback_id TEXT,
  is_live BOOLEAN DEFAULT false,
  stream_title TEXT,
  last_streamed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.vendor_streams ENABLE ROW LEVEL SECURITY;

-- 3. Policies
CREATE POLICY "Public can view live stream info" 
  ON public.vendor_streams FOR SELECT USING (true);

CREATE POLICY "Vendors can update their own stream info" 
  ON public.vendor_streams FOR ALL USING (auth.uid() = vendor_id);

-- 4. Add live status to vendor_profiles if needed (optional, but good for quick filtering)
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;

-- 5. Indexing
CREATE INDEX IF NOT EXISTS idx_vendor_streams_is_live ON public.vendor_streams(is_live);
