-- Atomically increment an internal analytics counter.
-- Callable only by the backend service role.

CREATE OR REPLACE FUNCTION public.increment_analytics_count(
    p_event_name text,
    p_placement text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_event_name IS NULL OR p_event_name NOT IN (
        'page_view',
        'section_view',
        'signup_click',
        'signup_role_selected',
        'signup_form_started',
        'signup_form_submitted',
        'signup_result',
        'profile_photo_added',
        'profile_goal_added',
        'qr_downloaded'
    ) THEN
        RAISE EXCEPTION 'Invalid analytics event';
    END IF;

    IF p_placement IS NULL
       OR length(p_placement) NOT BETWEEN 1 AND 64
       OR p_placement !~ '^[a-z0-9_]+$'
    THEN
        RAISE EXCEPTION 'Invalid analytics placement';
    END IF;

    INSERT INTO public.analytics_daily_counts (
        event_date,
        event_name,
        placement,
        event_count
    )
    VALUES (
        (now() AT TIME ZONE 'UTC')::date,
        p_event_name,
        p_placement,
        1
    )
    ON CONFLICT (event_date, event_name, placement)
    DO UPDATE SET
        event_count = public.analytics_daily_counts.event_count + 1;
END;
$$;

REVOKE ALL
ON FUNCTION public.increment_analytics_count(text, text)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.increment_analytics_count(text, text)
TO service_role;
