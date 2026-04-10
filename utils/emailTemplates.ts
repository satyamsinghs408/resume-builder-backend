/**
 * Premium Email Template Engine for CareerLeaf
 * Provides consistent branding and high-end design for all automated emails.
 */

interface TemplateOptions {
    tagline?: string;
    title: string;
    content: string;
    buttonText?: string;
    buttonUrl?: string;
    footerText?: string;
}

export const wrapPremiumTemplate = (options: TemplateOptions) => {
    const { tagline, title, content, buttonText, buttonUrl, footerText } = options;
    const year = new Date().getFullYear();
    const primaryColor = '#4F46E5'; // Indigo 600
    const secondaryColor = '#06B6D4'; // Cyan 500

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding-bottom: 60px; padding-top: 60px; }
        .main { background-color: #ffffff; width: 100%; max-width: 600px; margin: 0 auto; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02); }
        .header { background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%); padding: 60px 40px; text-align: center; }
        .logo-text { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; margin-bottom: 8px; }
        .tagline { color: rgba(255, 255, 255, 0.8); font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
        .body { padding: 48px 40px; }
        .title { color: #0f172a; font-size: 28px; font-weight: 800; margin-bottom: 24px; line-height: 1.2; letter-spacing: -0.02em; }
        .content { color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px; font-weight: 400; }
        .button-container { text-align: center; margin: 40px 0; }
        .button { background-color: ${primaryColor}; color: #ffffff !important; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3); transition: all 0.3s; }
        .footer { text-align: center; padding: 40px; background-color: #ffffff; border-top: 1px solid #f1f5f9; }
        .footer-text { color: #94a3b8; font-size: 13px; line-height: 1.5; margin-bottom: 16px; }
        .social-links { margin-bottom: 20px; }
        .divider { height: 1px; background-color: #f1f5f9; margin: 32px 0; }
        @media only screen and (max-width: 600px) {
            .main { border-radius: 0; border: none; }
            .header { padding: 40px 24px; }
            .body { padding: 32px 24px; }
            .title { font-size: 24px; }
        }
    </style>
</head>
<body>
    <center class="wrapper">
        <div class="main">
            <!-- Header Section -->
            <div class="header">
                ${tagline ? `<div class="tagline">${tagline}</div>` : ''}
                <div class="logo-text">CareerLeaf</div>
            </div>

            <!-- Content Section -->
            <div class="body">
                <div class="title">${title}</div>
                <div class="content">${content}</div>

                ${buttonText && buttonUrl ? `
                    <div class="button-container">
                        <a href="${buttonUrl}" class="button">${buttonText}</a>
                    </div>
                ` : ''}

                <div class="divider"></div>
                
                <p style="font-size: 14px; color: #64748b; font-style: italic;">
                    Building a better future, one career at a time.
                </p>
            </div>

            <!-- Footer Section -->
            <div class="footer">
                <p class="footer-text">
                    ${footerText || 'You received this email because you are registered with CareerLeaf.app or recently used our professional building tools.'}
                </p>
                <p class="footer-text">
                    &copy; ${year} CareerLeaf.app. All rights reserved. | <a href="https://careerleaf.app/contact" style="color: #4F46E5; text-decoration: none;">Support</a>
                </p>
            </div>
        </div>
    </center>
</body>
</html>
    `;
};

/**
 * Specifically for Feedback (Support notification)
 */
export const feedbackSupportTemplate = (data: { name: string; email: string; type: string; message: string }) => {
    return wrapPremiumTemplate({
        tagline: 'System Alert',
        title: 'New User Feedback Received',
        content: `
            <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin-top: 16px;">
                <p style="margin: 0 0 12px 0;"><strong>Sender Name:</strong> ${data.name}</p>
                <p style="margin: 0 0 12px 0;"><strong>Sender Email:</strong> ${data.email}</p>
                <p style="margin: 0 0 12px 0;"><strong>Feedback Type:</strong> <span style="background-color: ${data.type === 'bug' ? '#fee2e2' : '#e0e7ff'}; color: ${data.type === 'bug' ? '#991b1b' : '#3730a3'}; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">${data.type}</span></p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="margin: 0; font-weight: bold; color: #1e293b;">Message:</p>
                <p style="margin: 8px 0 0 0; white-space: pre-wrap; font-size: 14px;">${data.message}</p>
            </div>
        `,
        footerText: 'This is an internal notification from the CareerLeaf.app feedback engine.'
    });
};
