-- Table `analyses`
create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  file_id uuid references files(id),
  bpm integer,
  key text,
  duration numeric,
  energy numeric,
  genre text,
  style text,
  rhythm jsonb,
  created_at timestamptz default now()
);

-- Table `files`
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  path text,
  bucket text,
  file_type text,
  metadata jsonb,
  created_at timestamptz default now()
);
