import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Resend lazily or handle missing key to avoid crashing at startup
let resend: Resend | null = null;
try {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
} catch (err) {
  console.error('[Resend Init Error]: Failed to initialize Resend. Check your API key.');
}

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

/**
 * Sends an email using the Resend API.
 * This is an async function but should be called without 'await' in controllers
 * to maintain non-blocking behavior.
 */
const sendEmail = async (options: EmailOptions) => {
  if (!resend) {
    console.error('[Email Error]: Resend is not initialized. Please set RESEND_API_KEY in your .env file.');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM?.replace(/^["']|["']$/g, '') || 'Careerleaf Support <support@careerleaf.app>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    });

    if (error) {
      console.error('[Resend Error]:', error);
      return;
    }

    console.log(`[Email Success] ID: ${data?.id} | To: ${options.email}`);
  } catch (error) {
    console.error('[Email Internal Error]:', error);
  }
};

export default sendEmail;
