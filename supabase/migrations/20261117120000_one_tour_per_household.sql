-- One reservation per tour per invitation.
--
-- Two people on the same invitation each have their own login, and nothing stopped both of
-- them (or one person pressing twice) from booking the same tour, which would have been
-- charged twice. Activities already had this rule (unique household_id + activity_key).
-- Reservations with no household (the household was deleted) are not constrained.
-- If duplicates still exist when this runs, it fails instead of guessing which to keep.

create unique index if not exists tour_reservations_household_tour_key
  on public.tour_reservations (household_id, tour_id)
  where household_id is not null;

notify pgrst, 'reload schema';
