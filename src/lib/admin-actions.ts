import { supabase } from "@/integrations/supabase/client";

export const getResetPasswordHtml = (userName: string, resetLink: string) => {
  const currentYear = new Date().getFullYear();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 50px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.05em; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; font-weight: 500; }
        .content { padding: 40px; line-height: 1.8; }
        .content p { margin-bottom: 24px; font-size: 16px; color: #334155; }
        .highlight-box { background-color: #f0fdf4; padding: 28px; border-radius: 16px; border: 1px solid #bcf0da; margin: 35px 0; position: relative; }
        .highlight-box h3 { margin: 0 0 10px 0; color: #065f46; font-size: 18px; font-weight: 800; }
        .highlight-box p { margin: 0; font-size: 15px; color: #065f46; opacity: 0.9; }
        .button-container { text-align: center; margin: 45px 0; }
        .button { background-color: #059669; color: #ffffff !important; padding: 20px 40px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 18px; display: inline-block; transition: all 0.3s ease; box-shadow: 0 10px 15px -3px rgba(5, 150, 105, 0.3); }
        .footer { padding: 30px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 13px; color: #64748b; }
        .footer p { margin: 5px 0; }
        .logo-symbol { font-size: 32px; margin-bottom: 15px; display: block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="logo-symbol">✨</span>
          <h1>Lifestyle Medicine Gateway</h1>
          <p>Your Health & Wellness Journey, Redefined</p>
        </div>
        
        <div class="content">
          <p>Hi <strong>${userName}</strong>,</p>
          <p>We've recently upgraded the <strong>Lifestyle Medicine Gateway</strong> to a more powerful and secure system to serve you better.</p>
          
          <div class="highlight-box">
            <h3>Action Required</h3>
            <p>To ensure your account security and gain access to the new features, please reset your password using the link below.</p>
          </div>

          <div class="button-container">
            <a href="${resetLink}" class="button">Reset My Password</a>
          </div>

          <p>This link will securely direct you to our new system where you can choose a new password and immediately start exploring.</p>
          <p>If you didn't request this or have any questions, our support team is ready to help — just reply to this email.</p>
        </div>

        <div class="footer">
          <p>Sent from <strong>Lifestyle Medicine Gateway</strong></p>
          <p>&copy; ${currentYear} Lifestyle Medicine Gateway. All rights reserved.</p>
          <p style="margin-top: 15px; font-style: italic;">Empowering your journey to optimal health.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export async function sendBrandedResetEmail(email: string, fullName: string) {
  // 1. Generate Link via admin-api
  const { data: linkData, error: linkError } = await supabase.functions.invoke("admin-api", {
    body: { action: "reset-password", params: { email } },
  });

  if (linkError) throw linkError;
  if (!linkData?.link) throw new Error("Failed to generate secure reset link. Please contact support.");

  const htmlContent = getResetPasswordHtml(fullName || "Valued Member", linkData.link);

  // 2. Send Custom Email via send-email
  const { error: emailError } = await supabase.functions.invoke("send-email", {
    body: {
      to: email,
      subject: "Action Required: Reset your password for the new LMG Platform",
      html: htmlContent,
      fromName: "Lifestyle Medicine Gateway",
      fromEmail: "info@lifestylemedicinegateway.com",
    },
  });

  if (emailError) throw emailError;
  return { success: true };
}
