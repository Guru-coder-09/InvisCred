-- =============================================================
-- MSME Lender Intelligence Platform — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- Tables
-- =====================

-- Analysts (auto-linked to Supabase Auth users via trigger)
CREATE TABLE IF NOT EXISTS public.analysts (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT NOT NULL DEFAULT 'Analyst',
  role         TEXT NOT NULL DEFAULT 'junior_analyst'
               CHECK (role IN ('junior_analyst', 'senior_analyst', 'admin')),
  branch       TEXT NOT NULL DEFAULT 'Mumbai HQ',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- MSME Applicants
CREATE TABLE IF NOT EXISTS public.applicants (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT NOT NULL,
  sector            TEXT NOT NULL,
  city              TEXT NOT NULL,
  business_type     TEXT NOT NULL DEFAULT 'Sole Proprietorship',
  purpose           TEXT,
  loan_amount       NUMERIC(12,2),
  employment_count  INTEGER NOT NULL DEFAULT 1,
  upi_monthly_avg   NUMERIC(12,2) NOT NULL DEFAULT 0,
  gstin             TEXT,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by        UUID REFERENCES public.analysts(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit Scores
CREATE TABLE IF NOT EXISTS public.credit_scores (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id   UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  score          INTEGER NOT NULL CHECK (score >= 0 AND score <= 850),
  rating         TEXT NOT NULL,
  recommendation TEXT,
  suggested_limit NUMERIC(12,2),
  interest_rate  NUMERIC(5,2),
  evaluated_by   UUID REFERENCES public.analysts(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- XAI Reasoning Factors (child of credit_scores)
CREATE TABLE IF NOT EXISTS public.xai_factors (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  score_id    UUID NOT NULL REFERENCES public.credit_scores(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  impact      INTEGER NOT NULL,
  description TEXT,
  factor_type TEXT NOT NULL DEFAULT 'behavioral'
              CHECK (factor_type IN ('behavioral', 'financial', 'compliance', 'sector'))
);

-- Underwriting Decisions (append-only audit log)
CREATE TABLE IF NOT EXISTS public.decisions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  score_id     UUID REFERENCES public.credit_scores(id) ON DELETE SET NULL,
  decision     TEXT NOT NULL CHECK (decision IN ('Approved', 'Review', 'Declined')),
  officer_id   UUID NOT NULL REFERENCES public.analysts(id),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial Metrics (from Account Aggregator sync)
CREATE TABLE IF NOT EXISTS public.financial_metrics (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id   UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
  metric_type    TEXT NOT NULL,
  value          NUMERIC(12,2) NOT NULL,
  period_months  INTEGER NOT NULL DEFAULT 12,
  synced_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- Row Level Security
-- =====================
ALTER TABLE public.analysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xai_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;

-- Analysts: own profile only
CREATE POLICY "analysts_select_own" ON public.analysts
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "analysts_update_own" ON public.analysts
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "analysts_insert_own" ON public.analysts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Applicants: all authenticated analysts
CREATE POLICY "applicants_select" ON public.applicants FOR SELECT TO authenticated USING (true);
CREATE POLICY "applicants_insert" ON public.applicants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "applicants_update" ON public.applicants FOR UPDATE TO authenticated USING (true);

-- Credit Scores
CREATE POLICY "credit_scores_select" ON public.credit_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "credit_scores_insert" ON public.credit_scores FOR INSERT TO authenticated WITH CHECK (true);

-- XAI Factors
CREATE POLICY "xai_factors_select" ON public.xai_factors FOR SELECT TO authenticated USING (true);
CREATE POLICY "xai_factors_insert" ON public.xai_factors FOR INSERT TO authenticated WITH CHECK (true);

-- Decisions
CREATE POLICY "decisions_select" ON public.decisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "decisions_insert" ON public.decisions FOR INSERT TO authenticated WITH CHECK (true);

-- Financial Metrics
CREATE POLICY "financial_metrics_select" ON public.financial_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "financial_metrics_insert" ON public.financial_metrics FOR INSERT TO authenticated WITH CHECK (true);

-- =====================
-- Realtime
-- =====================
ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_metrics;

-- =====================
-- Trigger: auto-create analyst profile on signup
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.analysts (id, email, full_name, role, branch)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'junior_analyst'),
    COALESCE(NEW.raw_user_meta_data->>'branch', 'Mumbai HQ')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- Seed: 7 Demo Applicants
-- =====================
INSERT INTO public.applicants
  (name, sector, city, business_type, purpose, loan_amount, employment_count, upi_monthly_avg, gstin)
VALUES
  ('Sunita Enterprises',       'Retail / Street Food Vendor', 'Mumbai',   'Sole Proprietorship', 'Working Capital for Inventory', 250000, 4, 184000, '27AADCS1234A1Z5'),
  ('Meena Chaat Stall',        'Retail / Street Food Vendor', 'Mumbai',   'Sole Proprietorship', 'Equipment Purchase',            75000,  2,  82400, NULL),
  ('Gopal Mobile Repairs',     'Electronics Repair',          'Mumbai',   'Sole Proprietorship', 'Stock & Inventory',             60000,  1,  54200, '27AALCG2345B2Z1'),
  ('Fatima Tailoring Co.',     'Garment & Textiles',          'Surat',    'Partnership',         'Machinery Upgrade',            180000,  6,  94000, '24AABCF3456C3Z2'),
  ('Ajay Delivery Services',   'Logistics / Gig',             'Pune',     'Sole Proprietorship', 'Vehicle Repair',                45000,  1,  24800, NULL),
  ('Santosh Welding Works',    'Manufacturing',               'Nashik',   'Sole Proprietorship', 'Raw Material Purchase',        150000,  3, 112000, '27AAKCS5678E5Z4'),
  ('Lalita Flower Shop',       'Retail / Floriculture',       'Mumbai',   'Sole Proprietorship', 'Seasonal Stock',                40000,  2,  38000, NULL)
ON CONFLICT DO NOTHING;
