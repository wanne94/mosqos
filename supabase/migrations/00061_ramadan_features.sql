-- ============================================================================
-- Migration: 00061_ramadan_features.sql
-- Description: Ramadan settings and Zakat calculations tables
-- ============================================================================

-- Ramadan settings per organization
CREATE TABLE IF NOT EXISTS ramadan_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  hijri_year INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  suhoor_time TIME,
  iftar_time TIME,
  taraweeh_time TIME,
  taraweeh_rakats INTEGER DEFAULT 20,
  is_active BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),

  -- Ensure only one active setting per organization
  CONSTRAINT unique_org_hijri_year UNIQUE (organization_id, hijri_year)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ramadan_settings_org
  ON ramadan_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_ramadan_settings_active
  ON ramadan_settings(organization_id, is_active) WHERE is_active = true;

-- Zakat calculations history
CREATE TABLE IF NOT EXISTS zakat_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  person_id UUID REFERENCES members(id) ON DELETE SET NULL,
  calculation_date DATE DEFAULT CURRENT_DATE,
  nisab_value DECIMAL(12,2) NOT NULL,
  total_assets JSONB NOT NULL DEFAULT '{}',
  total_liabilities JSONB DEFAULT '{}',
  zakat_amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for zakat_calculations
CREATE INDEX IF NOT EXISTS idx_zakat_calc_org
  ON zakat_calculations(organization_id);
CREATE INDEX IF NOT EXISTS idx_zakat_calc_person
  ON zakat_calculations(person_id);
CREATE INDEX IF NOT EXISTS idx_zakat_calc_date
  ON zakat_calculations(calculation_date DESC);

-- Enable RLS
ALTER TABLE ramadan_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ramadan_settings
CREATE POLICY "Users can view ramadan settings for their organization"
  ON ramadan_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_owners WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_delegates WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage ramadan settings"
  ON ramadan_settings FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_owners WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_delegates WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- RLS Policies for zakat_calculations
CREATE POLICY "Users can view zakat calculations for their organization"
  ON zakat_calculations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_owners WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_delegates WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create zakat calculations"
  ON zakat_calculations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_owners WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_delegates WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage zakat calculations"
  ON zakat_calculations FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_owners WHERE user_id = auth.uid()
      UNION
      SELECT organization_id FROM organization_delegates WHERE user_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_ramadan_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ramadan_settings_updated_at
  BEFORE UPDATE ON ramadan_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_ramadan_settings_updated_at();

-- Add comments
COMMENT ON TABLE ramadan_settings IS 'Ramadan schedule and settings per organization';
COMMENT ON TABLE zakat_calculations IS 'History of Zakat calculations for tracking and records';
