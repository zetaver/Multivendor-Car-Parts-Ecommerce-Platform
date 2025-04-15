const nodemailer = require('nodemailer');

// Create a transporter with the admin's SMTP settings
const transporter = nodemailer.createTransport({
  host: 'mail.zetaver.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'khizar@zetaver.com', 
    pass: '_35lRkGryer;', 
  },
});

/**
 * Send an email reply to a contact form submission
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text email content
 * @param {string} options.html - HTML email content
 * @param {string} options.name - Recipient name
 * @param {string} options.replyToMessage - Original message being replied to
 * @returns {Promise} - Nodemailer send response
 */
const sendContactReply = async (options) => {
  try {
    const { to, subject, text, html, name, replyToMessage } = options;
    
    // Format the email to include the original message
    const formattedHtml = html || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1E1E2D; color: white; padding: 20px; text-align: center;">
          <h2>Reply from EasyCasse Support</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #eee;">
          <p>Hello ${name},</p>
          <p>Thank you for contacting us. Here is our response to your inquiry:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FFB800; margin: 20px 0;">
            ${text}
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 0.9em;"><strong>Your original message:</strong></p>
            <p style="color: #666; font-style: italic;">${replyToMessage}</p>
          </div>
          
          <p style="margin-top: 30px;">If you have any further questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>EasyCasse Support Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 0.8em; color: #666;">
          <p>&copy; ${new Date().getFullYear()} EasyCasse. All rights reserved.</p>
        </div>
      </div>
    `;
    
    // Prepare email
    const mailOptions = {
      from: '"EasyCasse Support" <khizar@zetaver.com>',
      to,
      subject: subject || 'Re: Your inquiry to EasyCasse Support',
      text: text || 'No plain text version provided',
      html: formattedHtml,
    };
    
    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendContactReply,
}; 