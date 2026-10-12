ALTER TABLE public.data_accounts
RENAME COLUMN gross_income TO balance;

ALTER TABLE public.data_accounts
ALTER COLUMN balance TYPE numeric(18,2)
USING balance::numeric(18,2);