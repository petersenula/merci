-- Global rate limiting for public aggregate analytics.
-- No IP addresses, cookies or visitor identifiers are stored.
-- The limit is shared across all application instances.

CREATE TABLE public.analytics_rate_limit_windows (
    window_start timestamptz PRIMARY KEY,
    request_count integer NOT NULL DEFAULT 0,
    CONSTRAINT analytics_rate_limit_count_check
        CHECK (request_count >= 0)
);

ALTER TABLE public.analytics_rate_limit_windows
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.analytics_rate_limit_windows
    FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.analytics_rate_limit_windows
    TO service_role;

CREATE TABLE public.analytics_rate_limit_maintenance (
    id integer PRIMARY KEY CHECK (id = 1),
    last_cleanup_date date NOT NULL
);

INSERT INTO public.analytics_rate_limit_maintenance (
    id, last_cleanup_date
)
VALUES (1, '1970-01-01');

ALTER TABLE public.analytics_rate_limit_maintenance
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.analytics_rate_limit_maintenance
    FROM PUBLIC, anon, authenticated;

GRANT SELECT, UPDATE
    ON TABLE public.analytics_rate_limit_maintenance
    TO service_role;

CREATE FUNCTION public.try_consume_analytics_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_window timestamptz;
    v_count integer;
BEGIN
    v_window := date_trunc('minute', now());

    -- One cleanup per UTC day, coordinated across instances.
    -- Never block analytics requests waiting for cleanup.
    IF pg_catalog.pg_try_advisory_xact_lock(154001, 1) THEN
        UPDATE public.analytics_rate_limit_maintenance
        SET last_cleanup_date = (now() AT TIME ZONE 'UTC')::date
        WHERE id = 1
          AND last_cleanup_date < (now() AT TIME ZONE 'UTC')::date;

        IF FOUND THEN
            DELETE FROM public.analytics_rate_limit_windows
            WHERE window_start < v_window - interval '24 hours';
        END IF;
    END IF;

    INSERT INTO public.analytics_rate_limit_windows (
        window_start,
        request_count
    )
    VALUES (v_window, 1)
    ON CONFLICT (window_start)
    DO UPDATE SET
        request_count =
            public.analytics_rate_limit_windows.request_count + 1
    WHERE public.analytics_rate_limit_windows.request_count < 300
    RETURNING request_count INTO v_count;

    RETURN v_count IS NOT NULL;
END;
$$;

REVOKE ALL
ON FUNCTION public.try_consume_analytics_rate_limit()
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE
ON FUNCTION public.try_consume_analytics_rate_limit()
TO service_role;
