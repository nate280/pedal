-- ============================================================================
-- Pedal — 0002: MOJO rename, "Bike NN" naming, numeric floor positions
-- ----------------------------------------------------------------------------
-- Brings an already-seeded database in line with the new conventions:
--   * Studio renamed to "MOJO Cycling Studio"
--   * Bikes renamed "Spin NN" -> "Bike NN"
--   * Floor positions converted from "Row A · 1" to simple numbers (1, 2, …)
--   * Fleet scaled up to 29 bikes
-- Idempotent: safe to run more than once.
-- ============================================================================

-- 1. Studio name -----------------------------------------------------------
update public.studios
   set name = 'MOJO Cycling Studio'
 where name = 'Ridgeline Cycle Co.';

-- 2. Bike names: "Spin NN" -> "Bike NN" -------------------------------------
update public.bikes
   set name = replace(name, 'Spin ', 'Bike ')
 where name like 'Spin %';

-- 3. Floor positions -> sequential numbers, ordered by name -----------------
with ordered as (
  select id,
         row_number() over (partition by studio_id order by name) as pos
    from public.bikes
)
update public.bikes b
   set floor_position = o.pos::text
  from ordered o
 where o.id = b.id;

-- 4. Scale the fleet up to 29 bikes -----------------------------------------
do $$
declare
  sid       uuid;
  existing  int;
  i         int;
begin
  select id into sid from public.studios order by created_at limit 1;
  if sid is null then return; end if;

  select count(*) into existing from public.bikes where studio_id = sid;

  i := existing;
  while i < 29 loop
    i := i + 1;
    insert into public.bikes (studio_id, name, floor_position, status)
    values (sid, 'Bike ' || lpad(i::text, 2, '0'), i::text, 'good');
  end loop;
end $$;
