create or replace function public.expected_currency_for_country(
  p_country_code text
)
returns text
language sql
immutable
strict
as $$
  select case upper(p_country_code)

    when 'CH' then 'CHF'
    when 'LI' then 'CHF'

    when 'AT' then 'EUR'
    when 'BE' then 'EUR'
    when 'BG' then 'EUR'
    when 'HR' then 'EUR'
    when 'CY' then 'EUR'
    when 'EE' then 'EUR'
    when 'FI' then 'EUR'
    when 'FR' then 'EUR'
    when 'DE' then 'EUR'
    when 'GR' then 'EUR'
    when 'IE' then 'EUR'
    when 'IT' then 'EUR'
    when 'LV' then 'EUR'
    when 'LT' then 'EUR'
    when 'LU' then 'EUR'
    when 'MT' then 'EUR'
    when 'NL' then 'EUR'
    when 'PT' then 'EUR'
    when 'SK' then 'EUR'
    when 'SI' then 'EUR'
    when 'ES' then 'EUR'

    when 'RO' then 'RON'
    when 'HU' then 'HUF'
    when 'PL' then 'PLN'
    when 'CZ' then 'CZK'
    when 'SE' then 'SEK'
    when 'DK' then 'DKK'

    else null
  end;
$$;

create or replace function public.guard_profile_country_currency()
returns trigger
language plpgsql
as $$
declare
  expected_currency text;
begin
  if upper(coalesce(new.currency, '')) <>
     upper(coalesce(old.currency, '')) then
    raise exception
      'account currency is immutable after registration';
  end if;

  if new.country_code is distinct from old.country_code then
    expected_currency :=
      public.expected_currency_for_country(new.country_code);

    if expected_currency is null then
      raise exception
        'unsupported country code: %',
        new.country_code;
    end if;

    if upper(coalesce(old.currency, '')) <> expected_currency then
      raise exception
        'country % requires currency %, but account currency is %',
        new.country_code,
        expected_currency,
        old.currency;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists employers_guard_country_currency
  on public.employers;

create trigger employers_guard_country_currency
before update of country_code, currency
on public.employers
for each row
execute function public.guard_profile_country_currency();

drop trigger if exists profiles_earner_guard_country_currency
  on public.profiles_earner;

create trigger profiles_earner_guard_country_currency
before update of country_code, currency
on public.profiles_earner
for each row
execute function public.guard_profile_country_currency();

comment on function public.expected_currency_for_country(text) is
  'Returns the Click4Tip account currency assigned to a supported registration country.';

comment on function public.guard_profile_country_currency() is
  'Prevents changing account currency after registration and allows country changes only within the existing account currency.';
