begin;

create unique index if not exists tips_payment_intent_id_unique_idx
  on public.tips (payment_intent_id)
  where payment_intent_id is not null;

create unique index if not exists tip_splits_tip_id_part_index_unique_idx
  on public.tip_splits (tip_id, part_index);

commit;
