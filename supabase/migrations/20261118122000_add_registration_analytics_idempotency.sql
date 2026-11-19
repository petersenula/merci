-- Idempotent, server-only registration analytics.
-- Stores internal user UUIDs, roles and dates only.
-- No email, IP address, names or browser identifiers.

CREATE TABLE public.analytics_registration_events (
    user_id uuid NOT NULL,
    registration_role text NOT NULL,
    registered_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT analytics_registration_events_pkey
        PRIMARY KEY (user_id),

    CONSTRAINT analytics_registration_events_role_check
        CHECK (registration_role IN ('earner', 'employer'))
);

ALTER TABLE public.analytics_registration_events
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.analytics_registration_events
    FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT
    ON TABLE public.analytics_registration_events
    TO service_role;

ALTER TABLE public.analytics_daily_counts
    DROP CONSTRAINT analytics_daily_counts_event_name_check;

ALTER TABLE public.analytics_daily_counts
    ADD CONSTRAINT analytics_daily_counts_event_name_check
    CHECK (event_name IN (
        'page_view',
        'section_view',
        'signup_click',
        'signup_role_selected',
        'signup_form_started',
        'signup_form_submitted',
        'signup_result',
        'registration_completed',
        'profile_photo_added',
        'profile_goal_added',
        'qr_downloaded'
    ));

CREATE FUNCTION public.record_registration_analytics(
    p_user_id uuid,
    p_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_inserted integer;
BEGIN
    IF p_user_id IS NULL
       OR p_role IS NULL
       OR p_role NOT IN ('earner', 'employer')
    THEN
        RAISE EXCEPTION 'Invalid registration analytics arguments';
    END IF;

    INSERT INTO public.analytics_registration_events (
        user_id,
        registration_role
    )
    VALUES (
        p_user_id,
        p_role
    )
    ON CONFLICT (user_id) DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;

    IF v_inserted = 0 THEN
        RETURN false;
    END IF;

    INSERT INTO public.analytics_daily_counts (
        event_date,
        event_name,
        placement,
        event_count
    )
    VALUES (
        (now() AT TIME ZONE 'UTC')::date,
        'registration_completed',
        p_role,
        1
    )
    ON CONFLICT (event_date, event_name, placement)
    DO UPDATE SET
        event_count = public.analytics_daily_counts.event_count + 1;

    RETURN true;
END;
$$;

REVOKE ALL
ON FUNCTION public.record_registration_analytics(uuid, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.record_registration_analytics(uuid, text)
TO service_role;
