/**
 * Email Service (Resend)
 * Sends transactional emails (Password Reset, Welcome to Mama Dish)
 * using the Resend API (https://resend.com).
 *
 * Configured via RESEND_API_KEY environment variable.
 * If RESEND_API_KEY is not set, logs the email in dev mode without throwing.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Mama Dish <onboarding@resend.dev>';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const EmailService = {
  isConfigured(): boolean {
    return Boolean(RESEND_API_KEY && RESEND_API_KEY.startsWith('re_'));
  },

  async send(options: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!this.isConfigured()) {
      console.log(`[EmailService] Dev mode (RESEND_API_KEY not set). Would send email to ${options.to}: "${options.subject}"`);
      return { success: true, id: 'dev-mode-mock' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[EmailService] Resend API error:', errorData);
        return { success: false, error: (errorData as any)?.message || `HTTP ${response.status}` };
      }

      const data = (await response.json()) as { id: string };
      return { success: true, id: data.id };
    } catch (err: any) {
      console.error('[EmailService] Network error sending email:', err);
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  /**
   * Send Password Reset Link / Code
   */
  async sendPasswordResetEmail(email: string, resetTokenOrCode: string): Promise<boolean> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; background-color: #FAF7F2; color: #1E211B;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #D95524; font-size: 28px; margin: 0; font-family: Georgia, serif;">Mama Dish</h1>
          <p style="color: #5A6251; font-size: 14px; margin-top: 6px;">Good food. Your taste. Your budget.</p>
        </div>
        <div style="background-color: #FFFFFF; border-radius: 16px; padding: 28px; border: 1px solid rgba(36, 40, 32, 0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <h2 style="font-size: 20px; color: #1E211B; margin-top: 0; font-family: Georgia, serif;">Reset your password</h2>
          <p style="font-size: 15px; line-height: 1.5; color: #5A6251;">
            We received a request to reset your Mama Dish password. Use the security code below to complete your reset in the app:
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; background-color: rgba(217, 85, 36, 0.08); color: #D95524; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 12px 28px; border-radius: 12px; border: 1px dashed rgba(217, 85, 36, 0.3);">
              ${resetTokenOrCode}
            </span>
          </div>
          <p style="font-size: 13px; line-height: 1.4; color: #8C9483; margin-bottom: 0;">
            If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
          </p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #8C9483;">
          Mama Dish · Good food on your budget
        </div>
      </div>
    `;

    const result = await this.send({
      to: email,
      subject: 'Reset your Mama Dish password',
      html,
      text: `Your Mama Dish password reset code is: ${resetTokenOrCode}`,
    });

    return result.success;
  },

  /**
   * Send Welcome Email upon Sign Up
   */
  async sendWelcomeEmail(email: string, name?: string): Promise<boolean> {
    const greetingName = name?.trim() || "Mama's Child";
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; background-color: #FAF7F2; color: #1E211B;">
        <div style="text-align: center; margin-bottom: 28px;">
          <h1 style="color: #D95524; font-size: 28px; margin: 0; font-family: Georgia, serif;">Mama Dish</h1>
          <p style="color: #5A6251; font-size: 14px; margin-top: 6px;">Welcome home, ${greetingName}</p>
        </div>
        <div style="background-color: #FFFFFF; border-radius: 16px; padding: 28px; border: 1px solid rgba(36, 40, 32, 0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <h2 style="font-size: 20px; color: #1E211B; margin-top: 0; font-family: Georgia, serif;">You're ready to cook delicious food</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #5A6251;">
            Welcome to Mama Dish! Every day, Mama gives you 1 perfect meal matched to what is in your house, your weekly budget, and your body goals.
          </p>
          <div style="margin: 20px 0; padding: 16px; background-color: rgba(217, 85, 36, 0.05); border-radius: 12px;">
            <p style="margin: 0 0 8px 0; font-weight: 700; color: #D95524; font-size: 14px;">How Mama works for you:</p>
            <ul style="margin: 0; padding-left: 20px; color: #5A6251; font-size: 14px; line-height: 1.6;">
              <li><strong>The Daily Edit:</strong> Tap the dice to roll authentic home dishes.</li>
              <li><strong>Kitchen Scan:</strong> Pick what you have in your cupboards for an instant match.</li>
              <li><strong>Earn XP:</strong> Get +50 XP every time you cook at home and unlock Healthy Remixes.</li>
            </ul>
          </div>
          <p style="font-size: 14px; color: #5A6251; margin-bottom: 0;">
            Open the app anytime you're hungry. Mama has your back!
          </p>
        </div>
      </div>
    `;

    const result = await this.send({
      to: email,
      subject: `Welcome to Mama Dish, ${greetingName}!`,
      html,
      text: `Welcome to Mama Dish, ${greetingName}! Good food, your taste, your budget.`,
    });

    return result.success;
  },
};

