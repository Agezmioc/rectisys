
ALTER TABLE public.data_parameters
ADD COLUMN true_margin NUMERIC(10, 2);

UPDATE public.data_parameters
SET true_margin = 50.00
WHERE id IN (1, 2);
