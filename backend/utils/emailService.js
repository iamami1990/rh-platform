const nodemailer = require('nodemailer');

/**
 * Email Service using Nodemailer
 */
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    // Create reusable transporter object using the default SMTP transport
    // For development, you can use Ethereal or Mailtrap
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'test@ethereal.email',
        pass: process.env.SMTP_PASS || 'password'
      }
    });

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Olympia HR" <${process.env.SMTP_FROM || 'no-reply@olympia-hr.com'}>`,
      to,
      subject,
      html,
      attachments
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SEND EMAIL ERROR:', error);
    throw error;
  }
};

module.exports = { sendEmail };
