CREATE TABLE IF NOT EXISTS public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT,
  account_number TEXT,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateways TO authenticated;
GRANT ALL ON public.payment_gateways TO service_role;

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_gateways_read" ON public.payment_gateways;
CREATE POLICY "payment_gateways_read" ON public.payment_gateways
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "payment_gateways_manage" ON public.payment_gateways;
CREATE POLICY "payment_gateways_manage" ON public.payment_gateways
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'support_manager'));

DROP TRIGGER IF EXISTS update_payment_gateways_updated_at ON public.payment_gateways;
CREATE TRIGGER update_payment_gateways_updated_at
  BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_gateway_id UUID REFERENCES public.payment_gateways(id) ON DELETE SET NULL;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_account_number TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sender_account TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;