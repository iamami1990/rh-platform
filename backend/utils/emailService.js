const nodemailer = require('nodemailer');

// Create transporter ONCE at module load time (reused across all sends)
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'test@ethereal.email',
        pass: process.env.SMTP_PASS || 'password'
      }
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    const transport = getTransporter();

    const info = await transport.sendMail({
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
