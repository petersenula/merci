-- Pricing programs for Click4tip partner / promo codes.
--
-- Important:
-- - TEAM programs apply only to employer accounts.
-- - INDIVIDUAL programs apply only to earner accounts.
-- - NULL valid_from  = available immediately.
-- - NULL valid_until = redeemable indefinitely.
-- - Once applied, a pricing assignment remains effective until replaced
--   by another valid pricing code.
-- - Payment runtime continues to use platform_fee_percent on the account.
-- - fee_bps uses basis points: 150 = 1.50%, 500 = 5.00%.

CREATE TABLE public.pricing_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL,

  code_normalized text
    GENERATED ALWAYS AS (upper(btrim(code))) STORED,

  name text NOT NULL,

  audience text NOT NULL
    CHECK (audience IN ('TEAM', 'INDIVIDUAL')),

  fee_bps integer NOT NULL
    CHECK (fee_bps >= 0 AND fee_bps <= 10000),

  valid_from timestamptz NULL,
  valid_until timestamptz NULL,

  is_active boolean NOT NULL DEFAULT true,

  max_redemptions integer NULL
    CHECK (max_redemptions IS NULL OR max_redemptions > 0),

  notes text NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pricing_programs_valid_period_check
    CHECK (
      valid_from IS NULL
      OR valid_until IS NULL
      OR valid_until > valid_from
    ),

  CONSTRAINT pricing_programs_code_not_blank_check
    CHECK (length(btrim(code)) > 0)
);

CREATE UNIQUE INDEX pricing_programs_code_normalized_uidx
  ON public.pricing_programs (code_normalized);

CREATE INDEX pricing_programs_audience_idx
  ON public.pricing_programs (audience);

CREATE INDEX pricing_programs_active_idx
  ON public.pricing_programs (is_active);


CREATE TABLE public.pricing_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  account_type text NOT NULL
    CHECK (account_type IN ('TEAM', 'INDIVIDUAL')),

  account_id uuid NOT NULL,

  pricing_program_id uuid NOT NULL
    REFERENCES public.pricing_programs(id)
    ON DELETE RESTRICT,

  code_snapshot text NOT NULL,

  fee_bps_snapshot integer NOT NULL
    CHECK (fee_bps_snapshot >= 0 AND fee_bps_snapshot <= 10000),

  effective_from timestamptz NOT NULL DEFAULT now(),
  effective_until timestamptz NULL,

  is_current boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT pricing_assignments_period_check
    CHECK (
      effective_until IS NULL
      OR effective_until >= effective_from
    )
);

CREATE UNIQUE INDEX pricing_assignments_one_current_per_account_uidx
  ON public.pricing_assignments (account_type, account_id)
  WHERE is_current = true;

CREATE INDEX pricing_assignments_program_idx
  ON public.pricing_assignments (pricing_program_id);

CREATE INDEX pricing_assignments_account_idx
  ON public.pricing_assignments (account_type, account_id);

CREATE INDEX pricing_assignments_created_at_idx
  ON public.pricing_assignments (created_at DESC);


-- Pricing tables are server-managed.
ALTER TABLE public.pricing_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_assignments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.pricing_programs
  FROM anon, authenticated;

REVOKE ALL ON TABLE public.pricing_assignments
  FROM anon, authenticated;


-- Atomic application of a pricing code.
--
-- Public result values:
--   OK       = code successfully applied (or already current)
--   INVALID  = code does not exist, is inactive, is for another account
--              type, is not active yet, or cannot be redeemed anymore
--   EXPIRED  = code existed but its redemption period has ended
--
-- The function intentionally does not reveal audience mismatch.
CREATE OR REPLACE FUNCTION public.apply_pricing_code(
  p_account_type text,
  p_account_id uuid,
  p_code text
)
RETURNS TABLE (
  result text,
  applied_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_type text;
  v_code text;
  v_program public.pricing_programs%ROWTYPE;
  v_existing public.pricing_assignments%ROWTYPE;
  v_redemption_count bigint;
  v_fee_percent numeric;
BEGIN
  v_account_type := upper(btrim(coalesce(p_account_type, '')));
  v_code := upper(btrim(coalesce(p_code, '')));

  IF p_account_id IS NULL
     OR v_code = ''
     OR v_account_type NOT IN ('TEAM', 'INDIVIDUAL') THEN
    RETURN QUERY SELECT 'INVALID'::text, NULL::text;
    RETURN;
  END IF;

  -- Verify that the account really exists in the requested account class.
  IF v_account_type = 'TEAM' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.employers
      WHERE user_id = p_account_id
    ) THEN
      RETURN QUERY SELECT 'INVALID'::text, NULL::text;
      RETURN;
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM public.profiles_earner
      WHERE id = p_account_id
    ) THEN
      RETURN QUERY SELECT 'INVALID'::text, NULL::text;
      RETURN;
    END IF;
  END IF;

  -- Lock the program row so redemption-limit checks are race-safe.
  SELECT *
  INTO v_program
  FROM public.pricing_programs
  WHERE code_normalized = v_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'INVALID'::text, NULL::text;
    RETURN;
  END IF;

  -- Do not reveal whether a real code belongs to another account type.
  IF NOT v_program.is_active
     OR v_program.audience <> v_account_type THEN
    RETURN QUERY SELECT 'INVALID'::text, NULL::text;
    RETURN;
  END IF;

  -- A future code is intentionally reported as generic INVALID.
  IF v_program.valid_from IS NOT NULL
     AND now() < v_program.valid_from THEN
    RETURN QUERY SELECT 'INVALID'::text, NULL::text;
    RETURN;
  END IF;

  IF v_program.valid_until IS NOT NULL
     AND now() > v_program.valid_until THEN
    RETURN QUERY SELECT 'EXPIRED'::text, NULL::text;
    RETURN;
  END IF;

  -- If this exact program is already current for this account,
  -- treat Apply as idempotent and do not create another assignment.
  SELECT *
  INTO v_existing
  FROM public.pricing_assignments
  WHERE account_type = v_account_type
    AND account_id = p_account_id
    AND is_current = true
  LIMIT 1;

  IF FOUND
     AND v_existing.pricing_program_id = v_program.id THEN
    RETURN QUERY
      SELECT 'OK'::text, v_existing.code_snapshot;
    RETURN;
  END IF;

  IF v_program.max_redemptions IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.pricing_assignments
       WHERE pricing_program_id = v_program.id
         AND account_type = v_account_type
         AND account_id = p_account_id
     ) THEN

    SELECT count(DISTINCT (account_type, account_id))
    INTO v_redemption_count
    FROM public.pricing_assignments
    WHERE pricing_program_id = v_program.id;

    IF v_redemption_count >= v_program.max_redemptions THEN
      RETURN QUERY SELECT 'INVALID'::text, NULL::text;
      RETURN;
    END IF;
  END IF;

  -- Close the previous assignment without deleting history.
  UPDATE public.pricing_assignments
  SET
    is_current = false,
    effective_until = now()
  WHERE account_type = v_account_type
    AND account_id = p_account_id
    AND is_current = true;

  INSERT INTO public.pricing_assignments (
    account_type,
    account_id,
    pricing_program_id,
    code_snapshot,
    fee_bps_snapshot,
    effective_from,
    effective_until,
    is_current
  )
  VALUES (
    v_account_type,
    p_account_id,
    v_program.id,
    v_program.code_normalized,
    v_program.fee_bps,
    now(),
    NULL,
    true
  );

  -- Existing payment code expects a percentage, while pricing programs
  -- store integer basis points.
  v_fee_percent := v_program.fee_bps::numeric / 100;

  IF v_account_type = 'TEAM' THEN
    UPDATE public.employers
    SET platform_fee_percent = v_fee_percent
    WHERE user_id = p_account_id;
  ELSE
    UPDATE public.profiles_earner
    SET platform_fee_percent = v_fee_percent
    WHERE id = p_account_id;
  END IF;

  RETURN QUERY
    SELECT 'OK'::text, v_program.code_normalized;
END;
$$;


REVOKE ALL
  ON FUNCTION public.apply_pricing_code(text, uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
  ON FUNCTION public.apply_pricing_code(text, uuid, text)
  TO service_role;


COMMENT ON TABLE public.pricing_programs IS
  'Server-managed Click4tip pricing programs for partner and promo codes.';

COMMENT ON TABLE public.pricing_assignments IS
  'Immutable pricing-code assignment history. One current assignment per account.';

COMMENT ON COLUMN public.pricing_programs.fee_bps IS
  'Click4tip platform fee in basis points. 150 = 1.50%.';

COMMENT ON COLUMN public.pricing_programs.valid_until IS
  'Last time at which this code may be redeemed. NULL means no expiry.';

COMMENT ON COLUMN public.pricing_assignments.fee_bps_snapshot IS
  'Fee captured when the code was applied so later program edits do not rewrite assignment history.';

-- Reset an account to the standard Click4tip platform fee.
-- The caller must resolve and authenticate the account server-side.
CREATE OR REPLACE FUNCTION public.reset_pricing_code(
  p_account_type text,
  p_account_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_account_type IS NULL
     OR p_account_type NOT IN ('TEAM', 'INDIVIDUAL') THEN
    RAISE EXCEPTION 'Invalid pricing account type';
  END IF;

  IF p_account_type = 'TEAM' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.employers
      WHERE user_id = p_account_id
    ) THEN
      RAISE EXCEPTION 'Pricing account not found';
    END IF;
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM public.profiles_earner
      WHERE id = p_account_id
    ) THEN
      RAISE EXCEPTION 'Pricing account not found';
    END IF;
  END IF;

  UPDATE public.pricing_assignments
  SET
    is_current = false,
    effective_until = now()
  WHERE account_type = p_account_type
    AND account_id = p_account_id
    AND is_current = true;

  IF p_account_type = 'TEAM' THEN
    UPDATE public.employers
    SET platform_fee_percent = 5
    WHERE user_id = p_account_id;
  ELSE
    UPDATE public.profiles_earner
    SET platform_fee_percent = 5
    WHERE id = p_account_id;
  END IF;
END;
$$;

REVOKE ALL
ON FUNCTION public.reset_pricing_code(text, uuid)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.reset_pricing_code(text, uuid)
FROM anon;

REVOKE ALL
ON FUNCTION public.reset_pricing_code(text, uuid)
FROM authenticated;

GRANT EXECUTE
ON FUNCTION public.reset_pricing_code(text, uuid)
TO service_role;
