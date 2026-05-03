-- 1. FIX RLS: Allow vendors to update their own items (status, tracking)
DROP POLICY IF EXISTS "Vendors can update their own order items" ON public.order_items;
CREATE POLICY "Vendors can update their own order items"
  ON public.order_items
  FOR UPDATE
  USING (auth.uid() = vendor_id);

-- 2. UNIFIED TRIGGER FUNCTION for Notifications
CREATE OR REPLACE FUNCTION public.handle_order_item_notifications()
RETURNS TRIGGER AS $$
DECLARE
  target_email text;
  order_data record;
  resend_api_key text := 're_F1GNSPL9_BfdxqC9qL3JRPBnzke1vYHJS';
  email_subject text;
  email_html text;
BEGIN
  -- Load order data for customer details
  SELECT * INTO order_data FROM public.orders WHERE id = NEW.order_id;

  -- CASE A: NEW ORDER (Notify Vendor)
  IF (TG_OP = 'INSERT') THEN
    SELECT email INTO target_email FROM auth.users WHERE id = NEW.vendor_id;
    IF target_email IS NULL THEN RETURN NEW; END IF;

    email_subject := '🌿 New Order Received: LMG-' || UPPER(SUBSTRING(NEW.order_id::text, 1, 8));
    email_html := '<div style="font-family: sans-serif; background-color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #10b981; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">New Order Received!</h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #475569;">You have a new product to fulfill for <b>' || order_data.first_name || ' ' || order_data.last_name || '</b>.</p>
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">' || NEW.product_name || ' (Qty: ' || NEW.quantity || ')</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #475569;">' || order_data.address || ', ' || order_data.city || '</p>
          </div>
          <div style="text-align: center;">
            <a href="https://lmgnew.vercel.app/vendor?tab=orders&orderId=' || NEW.order_id || '" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700;">Manage & Ship Order →</a>
          </div>
        </div>
      </div>
    </div>';

  -- CASE B: MARKED AS SHIPPED (Notify Customer)
  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'shipped' AND (OLD.status IS NULL OR OLD.status <> 'shipped')) THEN
    target_email := order_data.email;
    IF target_email IS NULL THEN RETURN NEW; END IF;

    email_subject := '🚀 Your Order has Shipped! - LMG-' || UPPER(SUBSTRING(NEW.order_id::text, 1, 8));
    email_html := '<div style="font-family: sans-serif; background-color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #10b981; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Your Item is on its Way!</h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #475569;">Great news, ' || order_data.first_name || '! Your item has been shipped by the vendor.</p>
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">' || NEW.product_name || '</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #475569;"><b>Tracking Number:</b> ' || COALESCE(NEW.tracking_number, 'In progress...') || '</p>
          </div>
          <div style="text-align: center;">
            <a href="https://lmgnew.vercel.app/profile?orderId=' || NEW.order_id || '" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700;">Track My Order →</a>
          </div>
        </div>
      </div>
    </div>';
  
  -- CASE C: MARKED AS DELIVERED (Notify Customer)
  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered')) THEN
    target_email := order_data.email;
    IF target_email IS NULL THEN RETURN NEW; END IF;

    email_subject := '🎁 Order Delivered! - LMG-' || UPPER(SUBSTRING(NEW.order_id::text, 1, 8));
    email_html := '<div style="font-family: sans-serif; background-color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #10b981; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Delivered!</h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #475569;">Hi ' || order_data.first_name || ', your wellness products have been delivered.</p>
          <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #1e293b;">' || NEW.product_name || '</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #10b981;">Enjoy your purchase! 🌿</p>
          </div>
          <div style="text-align: center;">
            <a href="https://lmgnew.vercel.app/profile" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700;">View My History →</a>
          </div>
        </div>
      </div>
    </div>';
  
  ELSE
    RETURN NEW; -- No notification needed for this update
  END IF;

  -- 3. SEND EMAIL
  PERFORM net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || resend_api_key),
    body := jsonb_build_object(
      'from', 'Lifestyle Medicine Gateway <noreply@lifestylemedicinegateway.com>',
      'to', ARRAY[target_email],
      'subject', email_subject,
      'html', email_html
    )
  );

  -- 4. NEW: Update parent order status to 'completed' if all items are delivered
  IF (NEW.status = 'delivered') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.order_items 
      WHERE order_id = NEW.order_id AND (status IS NULL OR status <> 'delivered')
    ) THEN
      UPDATE public.orders SET status = 'completed' WHERE id = NEW.order_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RE-APPLY TRIGGER
DROP TRIGGER IF EXISTS on_order_item_notification ON public.order_items;
CREATE TRIGGER on_order_item_notification
  AFTER INSERT OR UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_item_notifications();
