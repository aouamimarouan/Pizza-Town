import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (toEmail, name) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Pizza Town'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Bienvenue dans la famille Pizza Town ! 🍕',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e11d48;">Bienvenue chez Pizza Town, ${name} !</h1>
          <p>Nous sommes ravis de t'accueillir dans notre famille.</p>
          <p>Tu peux dès maintenant commander tes pizzas préférées ou réserver une table depuis ton compte.</p>
          <p>À très bientôt !</p>
          <p><strong>L'équipe Pizza Town</strong></p>
        </div>
      `,
    });
    console.log('Welcome email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendPasswordResetEmail = async (toEmail, token) => {
  try {
    // Generate the reset URL. In a real app, use the frontend origin from an env variable.
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
    
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Pizza Town'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Réinitialisation de ton mot de passe - Pizza Town 🔒',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">Réinitialisation de ton mot de passe</h2>
          <p>Nous avons reçu une demande de réinitialisation de mot de passe pour ton compte.</p>
          <p>Clique sur le bouton ci-dessous pour créer un nouveau mot de passe (le lien expirera dans 15 minutes) :</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
            Réinitialiser mon mot de passe
          </a>
          <p>Si tu n'as pas fait cette demande, tu peux ignorer cet email.</p>
          <p>L'équipe Pizza Town</p>
        </div>
      `,
    });
    console.log('Password reset email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

export const sendReservationConfirmedEmail = async (toEmail, details) => {
  try {
    const { full_name, res_date, res_time, guests } = details;
    const dateStr = new Date(res_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = new Date(res_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // In a real app, point this to the actual manage reservations link
    const manageUrl = `http://localhost:5173/account`;

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Pizza Town'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Your table at Pizza Town is confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; color: #14120F; background-color: #FAF9F7; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
          <h2 style="margin-top: 0;">Pizza Town</h2>
          <hr style="border: none; border-top: 1px solid #6B6862; margin: 20px 0;" />
          
          <p style="font-size: 16px; margin-bottom: 24px;">Your reservation is confirmed — we're waiting for you.</p>
          
          <div style="background-color: #F0EEEA; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${full_name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Date:</strong> ${dateStr}</p>
            <p style="margin: 0 0 10px 0;"><strong>Time:</strong> ${timeStr}</p>
            <p style="margin: 0;"><strong>Party Size:</strong> ${guests} guests</p>
          </div>
          
          <h3 style="font-size: 14px; color: #6B6862; margin-bottom: 10px;">Restaurant Details</h3>
          <p style="margin: 0 0 5px 0;">Pizza Town</p>
          <p style="margin: 0 0 24px 0; color: #6B6862;">123 Pizza Street<br>Open: 11:00 - 23:00</p>
          
          <hr style="border: none; border-top: 1px solid #6B6862; margin: 20px 0;" />
          <p style="font-size: 14px; color: #6B6862;">
            Plans changed? <a href="${manageUrl}" style="color: #14120F; text-decoration: underline;">Manage or cancel your reservation</a>.
          </p>
        </div>
      `,
    });
    console.log('Reservation confirmed email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending reservation confirmed email:', error);
  }
};

export const sendReservationDeclinedEmail = async (toEmail, details) => {
  try {
    const { full_name, reason } = details;
    const bookUrl = `http://localhost:5173/book`;

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Pizza Town'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Update regarding your Pizza Town reservation',
      html: `
        <div style="font-family: Arial, sans-serif; color: #14120F; background-color: #FAF9F7; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
          <h2 style="margin-top: 0;">Pizza Town</h2>
          <hr style="border: none; border-top: 1px solid #6B6862; margin: 20px 0;" />
          
          <p style="font-size: 16px; margin-bottom: 16px;">Hi ${full_name},</p>
          <p style="font-size: 16px; margin-bottom: 24px;">Unfortunately, we are unable to accommodate your reservation request at this time.</p>
          
          ${reason ? `<div style="background-color: #F0EEEA; padding: 15px; border-radius: 6px; margin-bottom: 24px;"><p style="margin: 0; color: #D62828;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
          
          <p style="font-size: 16px; margin-bottom: 24px;">We apologize for the inconvenience. We'd love to host you another time.</p>
          
          <a href="${bookUrl}" style="display: inline-block; background-color: #14120F; color: #FAF9F7; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Try a different date or time
          </a>
        </div>
      `,
    });
    console.log('Reservation declined email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending reservation declined email:', error);
  }
};
