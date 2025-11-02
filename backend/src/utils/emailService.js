const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Email templates
const emailTemplates = {
  emailVerification: (context) => ({
    subject: 'Email Verification - HealthNexus',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to HealthNexus!</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${context.firstName}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for joining HealthNexus. To complete your registration and secure your account, please verify your email address.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.verificationUrl}" style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Verify My Email
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't create an account with HealthNexus, please ignore this email.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            This link will expire in 24 hours for security reasons.
          </p>
        </div>
      </div>
    `
  }),

  resetPassword: (context) => ({
    subject: 'Password Reset Request - HealthNexus',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${context.firstName}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password for your HealthNexus account.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.resetUrl}" style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Reset My Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            This link will expire in 10 minutes for security reasons.
          </p>
        </div>
      </div>
    `
  }),

  appointmentConfirmation: (context) => ({
    subject: 'Appointment Confirmation - HealthNexus',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Confirmed</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${context.firstName}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your appointment has been confirmed. Here are the details:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> ${context.serviceName}</p>
            <p><strong>Date:</strong> ${context.appointmentDate}</p>
            <p><strong>Time:</strong> ${context.appointmentTime}</p>
            <p><strong>Provider:</strong> ${context.providerName}</p>
            <p><strong>Reference:</strong> ${context.bookingReference}</p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Please save this email for your records. We'll send you a reminder 24 hours before your appointment.
          </p>
        </div>
      </div>
    `
  }),

  appointmentReminder: (context) => ({
    subject: 'Appointment Reminder - Tomorrow - HealthNexus',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Reminder</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${context.firstName}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            This is a friendly reminder about your upcoming appointment tomorrow.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Service:</strong> ${context.serviceName}</p>
            <p><strong>Date:</strong> ${context.appointmentDate}</p>
            <p><strong>Time:</strong> ${context.appointmentTime}</p>
            <p><strong>Provider:</strong> ${context.providerName}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${context.rescheduleUrl}" style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-right: 10px;">
              Reschedule
            </a>
            <a href="${context.cancelUrl}" style="background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Cancel
            </a>
          </div>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    let emailContent;
    if (options.template && emailTemplates[options.template]) {
      emailContent = emailTemplates[options.template](options.context || {});
    } else {
      emailContent = {
        subject: options.subject,
        html: options.html || options.text
      };
    }

    const mailOptions = {
      from: `HealthNexus <${process.env.EMAIL_FROM}>`,
      to: options.to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

// Send bulk emails
const sendBulkEmail = async (recipients, template, context) => {
  const promises = recipients.map(recipient => 
    sendEmail({
      to: recipient.email,
      template,
      context: { ...context, firstName: recipient.firstName }
    })
  );

  try {
    const results = await Promise.allSettled(promises);
    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;
    
    return { successful, failed, total: recipients.length };
  } catch (error) {
    console.error('Bulk email sending error:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  emailTemplates
};