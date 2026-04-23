/**
 * Email Service for Lifestyle Medicine Gateway
 * 
 * To enable live emails, provide your API keys for a service like Resend or SendGrid.
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  vendorId?: string;
}

export const sendEmail = async ({ to, subject, html }: EmailPayload) => {
  console.log(`[Email Service] Sending email to: ${to} | Subject: ${subject}`);
  
  // In a real implementation, you would use an Edge Function or Server Action
  // to call an API like Resend.
  
  // Example with Resend (if using Edge Functions):
  /*
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Lifestyle Medicine Gateway <noreply@lifestylemedicinegateway.com>',
      to: [to],
      subject,
      html,
    }),
  });
  return res.json();
  */
  
  return { success: true, message: "Email simulation successful" };
};

export const emailTemplates = {
  orderConfirmation: (order: any) => ({
    subject: `Order Confirmed - #${order.id.slice(0, 8)}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #10b981;">Order Confirmed!</h1>
        <p>Hello ${order.first_name},</p>
        <p>Thank you for your order from Lifestyle Medicine Gateway. We're getting it ready for shipment.</p>
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Order Summary</h3>
          <p><strong>Order ID:</strong> ${order.id}</p>
          <p><strong>Total:</strong> $${order.total}</p>
          <p><strong>Address:</strong> ${order.address}, ${order.city}</p>
        </div>
        <p>We'll notify you as soon as your items have shipped.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">If you have any questions, please contact our support team.</p>
      </div>
    `
  }),
  
  passwordReset: (token: string) => ({
    subject: "Reset Your Password - Lifestyle Medicine Gateway",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. Click the button below to choose a new one:</p>
        <a href="https://lmgnew.vercel.app/reset-password?token=${token}" 
           style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Reset Password
        </a>
        <p style="font-size: 12px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  }),
  
  vendorApproval: (storeName: string) => ({
    subject: "Your Vendor Store is Approved!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #3b82f6;">Congratulations!</h1>
        <p>Your store <strong>${storeName}</strong> has been approved by the Lifestyle Medicine Gateway team.</p>
        <p>You can now log in to your dashboard and start adding products, articles, and going live!</p>
        <a href="https://lmgnew.vercel.app/vendor" 
           style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Go to Dashboard
        </a>
      </div>
    `
  }),

  vendorOrderNotification: (order: any, vendorItems: any[]) => ({
    subject: `New Order Received - LMG-${order.id.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #10b981;">New Order for Your Store!</h1>
        <p>Hello,</p>
        <p>You have received a new order on Lifestyle Medicine Gateway. Please fulfill the following items:</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
          <h3 style="margin-top: 0; color: #1e293b;">Customer Details</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${order.first_name} ${order.last_name}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.phone || 'Not provided'}</p>
          <p style="margin: 5px 0;"><strong>Address:</strong><br />${order.address}<br />${order.city}, ${order.state} ${order.zip}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #1e293b;">Items to Fulfill</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 10px 0;">Product</th>
                <th style="padding: 10px 0;">Qty</th>
                <th style="padding: 10px 0; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${vendorItems.map(item => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 0;">${item.name}</td>
                  <td style="padding: 10px 0;">${item.quantity}</td>
                  <td style="padding: 10px 0; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <p>Please log in to your dashboard to mark these items as <strong>Shipped</strong> and provide a tracking number.</p>
        
        <a href="https://lmgnew.vercel.app/vendor" 
           style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Manage Fulfillment
        </a>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">This is an automated notification from the Lifestyle Medicine Gateway Platform.</p>
      </div>
    `
  })
};
