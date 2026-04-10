import { Request, Response } from 'express';
import sendEmail from '../utils/sendEmail';

/**
 * @desc    Send contact email
 * @route   POST /api/contact
 * @access  Public
 */
export const handleContactForm = async (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'Please provide all fields' });
  }

  try {
    const { wrapPremiumTemplate } = await import('../utils/emailTemplates');

    // 1. Send notification to support (forwarded to Gmail)
    await sendEmail({
      email: process.env.EMAIL_USER!, // Send to the configured user email
      subject: `[Contact Form] ${subject}`,
      message: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: wrapPremiumTemplate({
        tagline: 'System Alert',
        title: 'New Contact Submission',
        content: `
          <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-top: 16px; border: 1px solid #e2e8f0;">
              <p style="margin: 0 0 12px 0;"><strong>Sender Name:</strong> ${name}</p>
              <p style="margin: 0 0 12px 0;"><strong>Sender Email:</strong> ${email}</p>
              <p style="margin: 0 0 12px 0;"><strong>Subject:</strong> ${subject}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="margin: 0; font-weight: bold; color: #1e293b;">Message Content:</p>
              <p style="margin: 8px 0 0 0; white-space: pre-wrap; font-size: 14px;">${message}</p>
          </div>
        `,
        footerText: 'This inquiry was generated from the public Contact Us page at CareerLeaf.app'
      })
    });

    // 2. Send confirmation to the user
    await sendEmail({
      email: email,
      subject: `We've Received Your Inquiry at CareerLeaf`,
      message: `Hi ${name},\n\nThank you for reaching out to us. We have received your message regarding "${subject}" and our team will get back to you within 24-48 hours.\n\nBest regards,\nCareerLeaf Support`,
      html: wrapPremiumTemplate({
        tagline: 'Message Received',
        title: 'Thank You for Reaching Out',
        content: `
          <p>Hi <strong>${name}</strong>,</p>
          <p>Thank you for contacting CareerLeaf support. We value your feedback and questions.</p>
          <p>This is to confirm that we have successfully received your inquiry regarding <strong>"${subject}"</strong>. Our dedicated support team is currently reviewing your message and will reach out to you within the next 24–48 hours.</p>
          <p>We appreciate your interest in building a better career with us.</p>
        `,
        buttonText: 'Visit Help Center',
        buttonUrl: `${process.env.FRONTEND_URL}/contact`,
        footerText: 'This is an automated confirmation. You don\'t need to reply to this email.'
      })
    });

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};
