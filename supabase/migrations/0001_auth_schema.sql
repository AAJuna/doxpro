-- doxpro freemium auth schema (Fase 1)
-- Apply this to your Supabase project via SQL Editor or supabase CLI.
--
-- Tables:
--   profiles        — per-user profile (auto-linked to auth.users)
--   organizations   — team workspace (only for Pro Team tier)
--   memberships     — user x org x role join (admin / member)
--   subscriptions   — license tier per user (Solo) or per org (Team)
--   audit_logs      — action history (Pro Team only)

-- ============================================================
-- profiles: extends auth.users with app-specific fields
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Auto-create profile row on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- organizations: team workspace (Pro Team only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);

-- ============================================================
-- memberships: user x org x role
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES public.profiles(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON public.memberships(org_id);

-- ============================================================
-- subscriptions: license per user (Solo) or per org (Team)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro_personal', 'pro_team', 'lifetime')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  current_period_end TIMESTAMPTZ,
  seats_included INTEGER NOT NULL DEFAULT 1,
  midtrans_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Either user_id (Solo) or org_id (Team), never both
  CONSTRAINT subscription_target CHECK (
    (user_id IS NOT NULL AND org_id IS NULL) OR
    (user_id IS NULL AND org_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON public.subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Auto-create free subscription for new users
CREATE OR REPLACE FUNCTION public.handle_new_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_subscription();

-- ============================================================
-- audit_logs: action history (Pro Team only)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(org_id, created_at DESC);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs      ENABLE ROW LEVEL SECURITY;

-- profiles: user can read/update own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- profiles: members can read profiles of same org (for member list display)
CREATE POLICY "profiles_select_same_org" ON public.profiles
  FOR SELECT USING (
    id IN (
      SELECT m.user_id FROM public.memberships m
      WHERE m.org_id IN (
        SELECT org_id FROM public.memberships WHERE user_id = auth.uid()
      )
    )
  );

-- organizations: members can see their orgs; admin can update
CREATE POLICY "organizations_select_member" ON public.organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "organizations_update_admin" ON public.organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM public.memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
CREATE POLICY "organizations_insert_own" ON public.organizations
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- memberships: members see same-org rows; admin can write
CREATE POLICY "memberships_select_same_org" ON public.memberships
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "memberships_insert_admin" ON public.memberships
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
CREATE POLICY "memberships_delete_admin" ON public.memberships
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM public.memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- subscriptions: user sees own (solo) or admin sees org's
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT org_id FROM public.memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- audit_logs: org admin only
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.memberships
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
