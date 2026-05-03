-- SQL to fix missing columns in vendor_profiles
-- Run this in your Supabase SQL Editor

ALTER TABLE public.vendor_profiles 
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_instructions TEXT,
ADD COLUMN IF NOT EXISTS store_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;

-- Ensure RLS is updated if needed (usually columns don't need explicit RLS if table has it)
-- This script ensures the frontend queries for these columns don't fail.
