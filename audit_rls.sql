-- AUDIT: CHECK RLS STATUS AND POLICIES
-- Run this script in the Supabase SQL Editor
-- 1. Check which tables have RLS enabled/disabled
SELECT schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
    LEFT JOIN pg_class ON pg_class.relname = pg_tables.tablename
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
ORDER BY rls_enabled ASC,
    -- Disabled tables first (High Risk)
    tablename;
-- 2. List all active RLS policies
SELECT schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename,
    policyname;