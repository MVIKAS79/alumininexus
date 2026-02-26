const nodemailer = require('nodemailer');

// Escape HTML special characters to prevent XSS in email templates
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send verification email
exports.sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: `"SIT Connect" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify Your Email - SIT Connect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 SIT Connect</h1>
            <p>Alumni & Student Network</p>
          </div>
          <div class="content">
            <h2>Welcome to SIT Connect!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
            <center>
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </center>
            <p>Or copy and paste this link in your browser:</p>
            <p style="background: #eee; padding: 10px; word-break: break-all; border-radius: 5px;">
              ${verificationUrl}
            </p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SIT Connect - Siddaganga Institute of Technology</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset email
exports.sendResetEmail = async (email, token) => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: `"SIT Connect" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset - SIT Connect',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
            <p>SIT Connect</p>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            <p>Or copy and paste this link in your browser:</p>
            <p style="background: #eee; padding: 10px; word-break: break-all; border-radius: 5px;">
              ${resetUrl}
            </p>
            <p><strong>This link will expire in 10 minutes.</strong></p>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SIT Connect - Siddaganga Institute of Technology</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send welcome email
exports.sendWelcomeEmail = async (email, name) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"SIT Connect" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Welcome to SIT Connect!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #667eea; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome, ${escapeHtml(name)}!</h1>
            <p>You're now part of the SIT family network</p>
          </div>
          <div class="content">
            <h2>Get Started with SIT Connect</h2>
            <p>Here's what you can do:</p>
            
            <div class="feature">
              <strong>🔍 Find Alumni</strong>
              <p>Search for alumni by batch, branch, or company</p>
            </div>
            
            <div class="feature">
              <strong>💬 Connect & Chat</strong>
              <p>Send connection requests and chat in real-time</p>
            </div>
            
            <div class="feature">
              <strong>🎯 Get Mentorship</strong>
              <p>Request guidance from experienced alumni</p>
            </div>
            
            <div class="feature">
              <strong>💼 Explore Opportunities</strong>
              <p>Find internships and job referrals posted by alumni</p>
            </div>
            
            <p style="margin-top: 20px;">Complete your profile to get the most out of SIT Connect!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SIT Connect - Siddaganga Institute of Technology</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send notification email
exports.sendNotificationEmail = async (email, subject, message) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"SIT Connect" <${process.env.SMTP_USER}>`,
    to: email,
    subject: escapeHtml(subject),
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📬 Notification</h1>
            <p>SIT Connect</p>
          </div>
          <div class="content">
            ${escapeHtml(message)}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} SIT Connect - Siddaganga Institute of Technology</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};
