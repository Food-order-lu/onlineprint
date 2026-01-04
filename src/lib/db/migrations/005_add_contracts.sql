-- Create contract status enum
create type contract_status as enum ('draft', 'signed', 'expired', 'terminated');

-- Create contracts table
create table if not exists contracts (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  quote_id uuid references quotes(id),
  document_url text not null,
  status contract_status default 'draft',
  signed_at timestamptz,
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add index for client lookups
create index idx_contracts_client_id on contracts(client_id);

-- Add RLS policies
alter table contracts enable row level security;

create policy "Enable read access for authenticated users"
  on contracts for select
  to authenticated
  using (true);

create policy "Enable insert access for authenticated users"
  on contracts for insert
  to authenticated
  with check (true);

create policy "Enable update access for authenticated users"
  on contracts for update
  to authenticated
  using (true);
