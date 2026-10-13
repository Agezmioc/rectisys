-- =========================================================
-- RLS: acceso para usuarios autenticados
-- =========================================================

-- ---------------------------------------------------------
-- DATA
-- ---------------------------------------------------------

alter table public.data_accounts enable row level security;

create policy "Authenticated users can select data_accounts"
on public.data_accounts
for select
to authenticated
using (true);

create policy "Authenticated users can insert data_accounts"
on public.data_accounts
for insert
to authenticated
with check (true);

create policy "Authenticated users can update data_accounts"
on public.data_accounts
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete data_accounts"
on public.data_accounts
for delete
to authenticated
using (true);


alter table public.data_conditions_types enable row level security;

create policy "Authenticated users can select data_conditions_types"
on public.data_conditions_types
for select
to authenticated
using (true);

create policy "Authenticated users can insert data_conditions_types"
on public.data_conditions_types
for insert
to authenticated
with check (true);

create policy "Authenticated users can update data_conditions_types"
on public.data_conditions_types
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete data_conditions_types"
on public.data_conditions_types
for delete
to authenticated
using (true);


alter table public.data_documents enable row level security;

create policy "Authenticated users can select data_documents"
on public.data_documents
for select
to authenticated
using (true);

create policy "Authenticated users can insert data_documents"
on public.data_documents
for insert
to authenticated
with check (true);

create policy "Authenticated users can update data_documents"
on public.data_documents
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete data_documents"
on public.data_documents
for delete
to authenticated
using (true);


alter table public.data_sequences enable row level security;

create policy "Authenticated users can select data_sequences"
on public.data_sequences
for select
to authenticated
using (true);

create policy "Authenticated users can insert data_sequences"
on public.data_sequences
for insert
to authenticated
with check (true);

create policy "Authenticated users can update data_sequences"
on public.data_sequences
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete data_sequences"
on public.data_sequences
for delete
to authenticated
using (true);


alter table public.data_tax_positions enable row level security;

create policy "Authenticated users can select data_tax_positions"
on public.data_tax_positions
for select
to authenticated
using (true);

create policy "Authenticated users can insert data_tax_positions"
on public.data_tax_positions
for insert
to authenticated
with check (true);

create policy "Authenticated users can update data_tax_positions"
on public.data_tax_positions
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete data_tax_positions"
on public.data_tax_positions
for delete
to authenticated
using (true);


alter table public.data_vat_types enable row level security;

create policy "Authenticated users can select data_vat_types"
on public.data_vat_types
for select
to authenticated
using (true);

create policy "Authenticated users can insert data_vat_types"
on public.data_vat_types
for insert
to authenticated
with check (true);

create policy "Authenticated users can update data_vat_types"
on public.data_vat_types
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete data_vat_types"
on public.data_vat_types
for delete
to authenticated
using (true);


alter table public.data_parameters enable row level security;

create policy "Authenticated users can select data_parameters"
on public.data_parameters
for select
to authenticated
using (true);

create policy "Authenticated users can insert data_parameters"
on public.data_parameters
for insert
to authenticated
with check (true);

create policy "Authenticated users can update data_parameters"
on public.data_parameters
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete data_parameters"
on public.data_parameters
for delete
to authenticated
using (true);


-- ---------------------------------------------------------
-- STOCK
-- ---------------------------------------------------------

alter table public.stock_articles enable row level security;

create policy "Authenticated users can select stock_articles"
on public.stock_articles
for select
to authenticated
using (true);

create policy "Authenticated users can insert stock_articles"
on public.stock_articles
for insert
to authenticated
with check (true);

create policy "Authenticated users can update stock_articles"
on public.stock_articles
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete stock_articles"
on public.stock_articles
for delete
to authenticated
using (true);


alter table public.stock_categories enable row level security;

create policy "Authenticated users can select stock_categories"
on public.stock_categories
for select
to authenticated
using (true);

create policy "Authenticated users can insert stock_categories"
on public.stock_categories
for insert
to authenticated
with check (true);

create policy "Authenticated users can update stock_categories"
on public.stock_categories
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete stock_categories"
on public.stock_categories
for delete
to authenticated
using (true);


alter table public.stock_classes enable row level security;

create policy "Authenticated users can select stock_classes"
on public.stock_classes
for select
to authenticated
using (true);

create policy "Authenticated users can insert stock_classes"
on public.stock_classes
for insert
to authenticated
with check (true);

create policy "Authenticated users can update stock_classes"
on public.stock_classes
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete stock_classes"
on public.stock_classes
for delete
to authenticated
using (true);


alter table public.stock_lists enable row level security;

create policy "Authenticated users can select stock_lists"
on public.stock_lists
for select
to authenticated
using (true);

create policy "Authenticated users can insert stock_lists"
on public.stock_lists
for insert
to authenticated
with check (true);

create policy "Authenticated users can update stock_lists"
on public.stock_lists
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete stock_lists"
on public.stock_lists
for delete
to authenticated
using (true);


alter table public.stock_motors enable row level security;

create policy "Authenticated users can select stock_motors"
on public.stock_motors
for select
to authenticated
using (true);

create policy "Authenticated users can insert stock_motors"
on public.stock_motors
for insert
to authenticated
with check (true);

create policy "Authenticated users can update stock_motors"
on public.stock_motors
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete stock_motors"
on public.stock_motors
for delete
to authenticated
using (true);


alter table public.stock_prices enable row level security;

create policy "Authenticated users can select stock_prices"
on public.stock_prices
for select
to authenticated
using (true);

create policy "Authenticated users can insert stock_prices"
on public.stock_prices
for insert
to authenticated
with check (true);

create policy "Authenticated users can update stock_prices"
on public.stock_prices
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete stock_prices"
on public.stock_prices
for delete
to authenticated
using (true);


alter table public.temp_articles enable row level security;

create policy "Authenticated users can select temp_articles"
on public.temp_articles
for select
to authenticated
using (true);

create policy "Authenticated users can insert temp_articles"
on public.temp_articles
for insert
to authenticated
with check (true);

create policy "Authenticated users can update temp_articles"
on public.temp_articles
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete temp_articles"
on public.temp_articles
for delete
to authenticated
using (true);


-- ---------------------------------------------------------
-- SALES
-- ---------------------------------------------------------

alter table public.sales_quotes enable row level security;

create policy "Authenticated users can select sales_quotes"
on public.sales_quotes
for select
to authenticated
using (true);

create policy "Authenticated users can insert sales_quotes"
on public.sales_quotes
for insert
to authenticated
with check (true);

create policy "Authenticated users can update sales_quotes"
on public.sales_quotes
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete sales_quotes"
on public.sales_quotes
for delete
to authenticated
using (true);


alter table public.sales_quotes_items enable row level security;

create policy "Authenticated users can select sales_quotes_items"
on public.sales_quotes_items
for select
to authenticated
using (true);

create policy "Authenticated users can insert sales_quotes_items"
on public.sales_quotes_items
for insert
to authenticated
with check (true);

create policy "Authenticated users can update sales_quotes_items"
on public.sales_quotes_items
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete sales_quotes_items"
on public.sales_quotes_items
for delete
to authenticated
using (true);


alter table public.sales_orders enable row level security;

create policy "Authenticated users can select sales_orders"
on public.sales_orders
for select
to authenticated
using (true);

create policy "Authenticated users can insert sales_orders"
on public.sales_orders
for insert
to authenticated
with check (true);

create policy "Authenticated users can update sales_orders"
on public.sales_orders
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete sales_orders"
on public.sales_orders
for delete
to authenticated
using (true);


alter table public.sales_orders_items enable row level security;

create policy "Authenticated users can select sales_orders_items"
on public.sales_orders_items
for select
to authenticated
using (true);

create policy "Authenticated users can insert sales_orders_items"
on public.sales_orders_items
for insert
to authenticated
with check (true);

create policy "Authenticated users can update sales_orders_items"
on public.sales_orders_items
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete sales_orders_items"
on public.sales_orders_items
for delete
to authenticated
using (true);


alter table public.sales_sections enable row level security;

create policy "Authenticated users can select sales_sections"
on public.sales_sections
for select
to authenticated
using (true);

create policy "Authenticated users can insert sales_sections"
on public.sales_sections
for insert
to authenticated
with check (true);

create policy "Authenticated users can update sales_sections"
on public.sales_sections
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete sales_sections"
on public.sales_sections
for delete
to authenticated
using (true);


alter table public.sales_states enable row level security;

create policy "Authenticated users can select sales_states"
on public.sales_states
for select
to authenticated
using (true);

create policy "Authenticated users can insert sales_states"
on public.sales_states
for insert
to authenticated
with check (true);

create policy "Authenticated users can update sales_states"
on public.sales_states
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete sales_states"
on public.sales_states
for delete
to authenticated
using (true);


-- ---------------------------------------------------------
-- AUTH / PROFILES
-- ---------------------------------------------------------

alter table public.profiles enable row level security;

create policy "Authenticated users can select profiles"
on public.profiles
for select
to authenticated
using (true);

create policy "Authenticated users can insert profiles"
on public.profiles
for insert
to authenticated
with check (true);

create policy "Authenticated users can update profiles"
on public.profiles
for update
to authenticated
using (true)
with check (true);

create policy "Authenticated users can delete profiles"
on public.profiles
for delete
to authenticated
using (true);


alter table public.roles enable row level security;

create policy "Authenticated users can select roles"
on public.roles
for select
to authenticated
using (true);