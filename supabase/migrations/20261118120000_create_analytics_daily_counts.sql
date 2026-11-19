-- Internal aggregate product analytics for Click4Tip.
-- No visitor IDs, IP addresses, emails or raw event payloads.
-- Server-managed only. No direct client access.

CREATE TABLE public.analytics_daily_counts (
    event_date date NOT NULL,
    event_name text NOT NULL,
    placement text NOT NULL,
    event_count bigint NOT NULL DEFAULT 0,

    CONSTRAINT analytics_daily_counts_pkey
        PRIMARY KEY (event_date, event_name, placement),

    CONSTRAINT analytics_daily_counts_event_name_check
        CHECK (event_name IN (
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
        )),

    CONSTRAINT analytics_daily_counts_placement_check
        CHECK (
            length(placement) BETWEEN 1 AND 64
            AND placement ~ '^[a-z0-9_]+$'
        ),

    CONSTRAINT analytics_daily_counts_count_check
        CHECK (event_count >= 0)
);

CREATE INDEX analytics_daily_counts_event_date_idx
    ON public.analytics_daily_counts (event_date DESC);

ALTER TABLE public.analytics_daily_counts
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.analytics_daily_counts
    FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, UPDATE
    ON TABLE public.analytics_daily_counts
    TO service_role;
