ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for text;

CREATE TABLE IF NOT EXISTS swipes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade not null,
  target_id    uuid references profiles(id) on delete cascade not null,
  direction    text check (direction in ('left', 'right')) not null,
  created_at   timestamptz default now(),
  unique(user_id, target_id)
);
