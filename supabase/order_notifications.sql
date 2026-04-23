-- 0. Ensure order_items table has the necessary columns
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES public.vendor_profiles(id);

-- Enable pg_net extension for HTTP requests
create extension if not exists pg_net;

-- Function to send order notification to vendor
create or replace function public.notify_vendor_of_new_order()
returns trigger as $$
declare
  vendor_email text;
  order_data record;
  items_html text;
  resend_api_key text := 're_F1GNSPL9_BfdxqC9qL3JRPBnzke1vYHJS'; -- Your Resend Key
begin
  -- 1. Get vendor email from auth.users
  select email into vendor_email from auth.users where id = new.vendor_id;
  
  -- If no email found, exit early to avoid errors
  if vendor_email is null then
    return new;
  end if;
  
  -- 2. Get order details
  select * into order_data from public.orders where id = new.order_id;
  
  -- 3. Construct items list (simple version for single item)
  items_html := '<li>' || new.product_name || ' (Qty: ' || new.quantity || ') - $' || (new.price * new.quantity) || '</li>';

  -- 4. Send email via Resend API
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || resend_api_key
    ),
    body := jsonb_build_object(
      'from', 'Lifestyle Medicine Gateway <noreply@lifestylemedicinegateway.com>',
      'to', ARRAY[vendor_email],
      'subject', 'New Order Received - LMG-' || upper(substring(new.order_id::text, 1, 8)),
      'html', '<h1>New Order!</h1><p>You have a new order to fulfill.</p><h3>Customer:</h3><p>' || order_data.first_name || ' ' || order_data.last_name || '<br/>' || order_data.address || '</p><h3>Items:</h3><ul>' || items_html || '</ul>'
    )
  );

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run on every new order item
drop trigger if exists on_new_order_item on public.order_items;
create trigger on_new_order_item
  after insert on public.order_items
  for each row execute function public.notify_vendor_of_new_order();
