-- ============================================================================
-- Pedal — sample data (optional)
-- Run AFTER 0001_init.sql to populate a demo studio, fleet, and issue history.
-- Safe to skip in production. Idempotent: does nothing if a studio exists.
-- ============================================================================

do $$
declare
  sid uuid;
begin
  if exists (select 1 from public.studios) then
    raise notice 'Pedal seed skipped — a studio already exists.';
    return;
  end if;

  insert into public.studios (name)
  values ('MOJO Cycling Studio')
  returning id into sid;

  -- Fleet: 29 bikes, floor positions are simple numbers (1–29) ----------
  -- A handful start in a non-good state to mirror a real floor.
  insert into public.bikes (studio_id, name, floor_position, status)
  select
    sid,
    'Bike ' || lpad(n::text, 2, '0'),
    n::text,
    case n
      when 2 then 'out_of_service'
      when 3 then 'out_of_service'
      when 7 then 'needs_attention'
      when 11 then 'needs_attention'
      when 14 then 'needs_attention'
      else 'good'
    end::bike_status
  from generate_series(1, 29) as n;

  -- Issues --------------------------------------------------------------
  -- Open / active issues
  insert into public.issues (bike_id, description, severity, status, reported_by, created_at, resolved_at) values
    ((select id from public.bikes where studio_id = sid and name = 'Bike 03'),
     'Flywheel emits a loud grinding noise under load — pulled from rotation.',
     'high', 'open', 'Maya R.', now() - interval '2 days', null),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 02'),
     'Resistance knob completely seized, magnet assembly suspected.',
     'high', 'in_progress', 'Devon K.', now() - interval '4 days', null),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 07'),
     'Console display flickers intermittently during class.',
     'medium', 'open', 'Maya R.', now() - interval '1 day', null),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 11'),
     'Left pedal strap torn, needs replacement.',
     'medium', 'in_progress', 'Sam T.', now() - interval '3 days', null),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 14'),
     'Water bottle cage cracked, rattles when riding.',
     'low', 'open', 'Devon K.', now() - interval '6 days', null);

  -- Resolved issues spread across the last 8 weeks (drives the trend chart)
  insert into public.issues (bike_id, description, severity, status, reported_by, created_at, resolved_at) values
    ((select id from public.bikes where studio_id = sid and name = 'Bike 01'),
     'Seat post slipping under rider weight.',
     'medium', 'resolved', 'Sam T.', now() - interval '6 days', now() - interval '5 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 05'),
     'Squeak from bottom bracket, lubricated.',
     'low', 'resolved', 'Maya R.', now() - interval '9 days', now() - interval '8 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 09'),
     'Handlebar fore/aft adjustment lever stripped.',
     'medium', 'resolved', 'Devon K.', now() - interval '12 days', now() - interval '10 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 03'),
     'Cleat clip on right pedal worn, replaced.',
     'medium', 'resolved', 'Sam T.', now() - interval '15 days', now() - interval '14 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 12'),
     'Belt tension loose, retensioned.',
     'high', 'resolved', 'Maya R.', now() - interval '18 days', now() - interval '17 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 06'),
     'Console buttons unresponsive from sweat damage.',
     'medium', 'resolved', 'Devon K.', now() - interval '22 days', now() - interval '20 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 02'),
     'Crank arm play / wobble — tightened.',
     'high', 'resolved', 'Sam T.', now() - interval '26 days', now() - interval '24 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 08'),
     'Pedal squeak, serviced.',
     'low', 'resolved', 'Maya R.', now() - interval '30 days', now() - interval '29 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 11'),
     'Resistance felt uneven, recalibrated.',
     'medium', 'resolved', 'Devon K.', now() - interval '34 days', now() - interval '32 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 13'),
     'Seat clamp replaced after class report.',
     'low', 'resolved', 'Sam T.', now() - interval '40 days', now() - interval '38 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 03'),
     'Flywheel bearing serviced (prior).',
     'high', 'resolved', 'Maya R.', now() - interval '45 days', now() - interval '43 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 07'),
     'Display brightness fixed.',
     'low', 'resolved', 'Devon K.', now() - interval '50 days', now() - interval '49 days'),
    ((select id from public.bikes where studio_id = sid and name = 'Bike 04'),
     'Toe cage replaced.',
     'low', 'resolved', 'Sam T.', now() - interval '54 days', now() - interval '53 days');

  -- A few notes on active repairs ---------------------------------------
  insert into public.issue_notes (issue_id, note, created_by)
  select i.id, 'Ordered replacement magnet assembly — ETA Friday.', 'Devon K.'
  from public.issues i
  join public.bikes b on b.id = i.bike_id
  where b.studio_id = sid and b.name = 'Bike 02' and i.status = 'in_progress';

  insert into public.issue_notes (issue_id, note, created_by)
  select i.id, 'Confirmed grinding originates from drive side. Bike tagged out of service.', 'Maya R.'
  from public.issues i
  join public.bikes b on b.id = i.bike_id
  where b.studio_id = sid and b.name = 'Bike 03' and i.status = 'open';

  insert into public.issue_notes (issue_id, note, created_by)
  select i.id, 'New straps in stock, swapping today.', 'Sam T.'
  from public.issues i
  join public.bikes b on b.id = i.bike_id
  where b.studio_id = sid and b.name = 'Bike 11' and i.status = 'in_progress';

  raise notice 'Pedal seed complete: 29 bikes, 18 issues.';
end $$;
