import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send an invitation email
 * @param to Email recipient
 * @param inviteToken Invitation token
 * @param inviteUrl URL for the invitation
 */
export const sendInviteEmail = async (
  to: string,
  inviteToken: string,
  inviteUrl: string
): Promise<boolean> => {
  try {
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'support@redbutton.app',
      to,
      subject: 'Invitation to RedButton',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3E63DD;">Welcome to RedButton!</h2>
          <p>You've been invited to join RedButton, a minimalist assistant application designed to help you react to your inner states.</p>
          <p>Click the button below to accept your invitation and create your account:</p>
          <a href="${inviteUrl}" style="display: inline-block; background-color: #3E63DD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Accept Invitation</a>
          <p>This invitation link will expire in 7 days.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you,<br>The RedButton Team</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return false;
  }
};

/**
 * Send a password reset email
 * @param to Email recipient
 * @param resetToken Password reset token
 * @param resetUrl URL for password reset
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string,
  resetUrl: string
): Promise<boolean> => {
  try {
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'support@redbutton.app',
      to,
      subject: 'Password Reset - RedButton',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3E63DD;">Reset Your Password</h2>
          <p>You requested a password reset for your RedButton account. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #3E63DD; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email or contact support if you have concerns.</p>
          <p>Thank you,<br>The RedButton Team</p>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
}; 