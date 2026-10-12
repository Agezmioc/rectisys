ALTER TABLE public.sales_quotes
ADD COLUMN user_id UUID REFERENCES auth.users(id);

ALTER TABLE public.sales_orders
ADD COLUMN user_id UUID REFERENCES auth.users(id);