-- account_table
ALTER TABLE public.account_table
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_everyone_account_table
  ON public.account_table
  FOR ALL
  TO public, authenticated, anon
  USING ( true )
  WITH CHECK ( true );

-- intro_advertisements
ALTER TABLE public.intro_advertisements
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_everyone_intro_advertisements
  ON public.intro_advertisements
  FOR ALL
  TO public, authenticated, anon
  USING ( true )
  WITH CHECK ( true );

-- payment_table
ALTER TABLE public.payment_table
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_everyone_payment_table
  ON public.payment_table
  FOR ALL
  TO public, authenticated, anon
  USING ( true )
  WITH CHECK ( true );

-- product_details
ALTER TABLE public.product_details
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_everyone_product_details
  ON public.product_details
  FOR ALL
  TO public, authenticated, anon
  USING ( true )
  WITH CHECK ( true );

-- trans_items_table
ALTER TABLE public.trans_items_table
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_everyone_trans_items_table
  ON public.trans_items_table
  FOR ALL
  TO public, authenticated, anon
  USING ( true )
  WITH CHECK ( true );

-- trans_table
ALTER TABLE public.trans_table
  ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_everyone_trans_table
  ON public.trans_table
  FOR ALL
  TO public, authenticated, anon
  USING ( true )
  WITH CHECK ( true );
