-- ============================================================
--  supabase_schema.sql
--  À coller dans : Supabase → SQL Editor → New query → Run
-- ============================================================

-- -------------------------------------------------------
--  Table principale des tags
-- -------------------------------------------------------
create table if not exists tags (
  id             uuid primary key default gen_random_uuid(),
  blaze          text not null,
  couleur        text not null default '#E63946',
  latitude       double precision not null,
  longitude      double precision not null,
  photo_url      text,
  support        text,
  style          text,
  date_vue       date,
  rotation       int default 0,
  validated      boolean default false,
  hidden         boolean default false,   -- masqué : contenu illicite (invisible)
  archived       boolean default false,   -- archivé : tag disparu (grisé, visible)
  reports_count  int default 0,           -- compteur signalements illicites
  disparus_count int default 0,           -- compteur signalements "disparu"
  created_at     timestamptz default now()
);

create index if not exists tags_location_idx  on tags (latitude, longitude);
create index if not exists tags_validated_idx on tags (validated, hidden);
create index if not exists tags_archived_idx  on tags (archived);

-- -------------------------------------------------------
--  Table des signalements
-- -------------------------------------------------------
create table if not exists signalements (
  id           uuid primary key default gen_random_uuid(),
  tag_id       uuid not null references tags(id) on delete cascade,
  motif        text not null,
  detail       text,
  type_signal  text not null default 'illicite', -- 'illicite' | 'disparu'
  created_at   timestamptz default now()
);

create index if not exists signalements_tag_idx  on signalements (tag_id);
create index if not exists signalements_type_idx on signalements (type_signal);

-- -------------------------------------------------------
--  Trigger : masquage (illicite ≥ 3) et archivage (disparu ≥ 5)
-- -------------------------------------------------------
create or replace function check_reports_threshold()
returns trigger as $$
begin

  if NEW.type_signal = 'illicite' then
    -- Incrémenter le compteur illicite
    update tags set reports_count = reports_count + 1 where id = NEW.tag_id;
    -- Masquer si seuil atteint
    update tags set hidden = true
      where id = NEW.tag_id and reports_count >= 3;

  elsif NEW.type_signal = 'disparu' then
    -- Incrémenter le compteur disparu
    update tags set disparus_count = disparus_count + 1 where id = NEW.tag_id;
    -- Archiver si seuil atteint (ne pas masquer — rester visible mais grisé)
    update tags set archived = true
      where id = NEW.tag_id and disparus_count >= 5;
  end if;

  return NEW;
end;
$$ language plpgsql;

drop trigger if exists on_new_signalement on signalements;
create trigger on_new_signalement
  after insert on signalements
  for each row execute function check_reports_threshold();

-- -------------------------------------------------------
--  Politiques RLS
-- -------------------------------------------------------
alter table tags enable row level security;
alter table signalements enable row level security;

-- Lecture publique : tags validés, non masqués (archivés inclus — grisés sur la carte)
create policy "Lecture publique tags"
  on tags for select
  using (validated = true and hidden = false);

-- Soumission publique
create policy "Insertion publique tags"
  on tags for insert
  with check (true);

-- Modification et suppression : admin connecté uniquement
create policy "Mise à jour admin"
  on tags for update
  using (auth.role() = 'authenticated');

create policy "Suppression admin"
  on tags for delete
  using (auth.role() = 'authenticated');

-- Signalements : tout le monde peut signaler
create policy "Insertion publique signalements"
  on signalements for insert
  with check (true);

-- Lecture des signalements : admin connecté uniquement
create policy "Lecture signalements admin"
  on signalements for select
  using (auth.role() = 'authenticated');
