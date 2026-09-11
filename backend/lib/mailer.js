import 'dotenv/config';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: (process.env.EMAIL_USER || '').trim(),
    pass: (process.env.EMAIL_PASS || '').trim(),
  },
});

export const getFrontendUrl = (customOrigin) => {
  if (customOrigin && typeof customOrigin === 'string' && customOrigin.startsWith('http')) {
    return customOrigin.replace(/\/+$/, '');
  }
  const base = process.env.FRONTEND_URL || 'https://pizza-town.vercel.app';
  return base.replace(/\/+$/, '');
};

export const sendWelcomeEmail = async (toEmail, name, origin) => {
  try {
    const menuUrl = `${getFrontendUrl(origin)}/menu`;
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Pizza Town'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Bienvenue dans la famille Pizza Town ! 🍕',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #14120F; background-color: #FAF9F7; border-radius: 8px;">
          <h1 style="color: #e11d48; margin-top: 0;">Bienvenue chez Pizza Town, ${name} !</h1>
          <p>Nous sommes ravis de t'accueillir dans notre famille.</p>
          <p>Tu peux dès maintenant commander tes pizzas préférées ou réserver une table depuis ton compte.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${menuUrl}" style="display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Découvrir notre carte 🍕
            </a>
          </div>
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

export const sendPasswordResetEmail = async (toEmail, token, origin) => {
  try {
    const resetUrl = `${getFrontendUrl(origin)}/reset-password?token=${token}`;
    
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

export const sendReservationConfirmedEmail = async (toEmail, details, origin) => {
  try {
    const { full_name, res_date, res_time, guests } = details;
    const dateStr = new Date(res_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = new Date(res_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const manageUrl = `${getFrontendUrl(origin)}/account`;

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

export const sendReservationDeclinedEmail = async (toEmail, details, origin) => {
  try {
    const { full_name, reason } = details;
    const bookUrl = `${getFrontendUrl(origin)}/book`;

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

export const sendPostOrderReviewEmail = async (toEmail, details, origin) => {
  const { full_name, order_id } = details;
  const reviewUrl = `${getFrontendUrl(origin)}/review/${order_id}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Pizza Town'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Comment s\'est passée votre commande ? 🍕',
    html: `
      <div style="font-family: Arial, sans-serif; color: #14120F; background-color: #FAF9F7; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 8px;">
        <h2 style="margin-top: 0; color: #D62828;">Pizza Town</h2>
        <hr style="border: none; border-top: 1px solid #6B6862; margin: 20px 0;" />
        
        <p style="font-size: 16px; margin-bottom: 16px;">Bonjour ${full_name},</p>
        <p style="font-size: 16px; margin-bottom: 24px;">Merci d'avoir commandé chez Pizza Town ! Nous espérons que vous vous êtes régalé.</p>
        
        <p style="font-size: 16px; margin-bottom: 24px;">Votre avis est très important pour nous aider à toujours nous améliorer. Pourriez-vous prendre une minute pour évaluer votre expérience ?</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reviewUrl}" style="display: inline-block; background-color: #D62828; color: #FAF9F7; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Laisser un avis
          </a>
        </div>
        
        <p style="font-size: 14px; color: #6B6862; margin-top: 30px;">À très bientôt !<br>L'équipe Pizza Town</p>
      </div>
    `,
  };

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Post-order review email sent: %s', info.messageId);
      return; // Success, exit the loop
    } catch (error) {
      console.error(`Error sending review email (Attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt === maxRetries) {
        console.error('Failed to send review email after maximum retries.');
      } else {
        // Wait for 2 seconds before retrying
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }
};

export const sendOrderCancelledEmail = async (toEmail, details) => {
  try {
    const { order_id, full_name, reason, total_price, delivery_type } = details;
    const shortId = order_id ? (order_id.includes('-') ? order_id.split('-')[0].toUpperCase() : order_id) : '';
    const formattedTotal = total_price ? `€${parseFloat(total_price).toFixed(2)}` : null;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Pizza Town'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Pizza Town - Bestelling #${shortId} Geannuleerd / Order Cancelled`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #14120F; background-color: #FAF9F7; padding: 40px 20px; max-width: 600px; margin: 0 auto; border-radius: 10px; border: 1px solid #E5E2DC;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="margin: 0; color: #D62828; font-size: 26px; font-weight: 800; letter-spacing: 1px;">PIZZA TOWN</h1>
            <p style="margin: 4px 0 0 0; color: #6B6862; font-size: 13px;">Stationsstraat 14, 1861 Meise • Tel: 02 269 71 76</p>
          </div>

          <div style="background-color: #FFFFFF; border-radius: 8px; padding: 24px; border: 1px solid #E5E2DC; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
            <div style="display: inline-block; background-color: #FEE2E2; color: #DC2626; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 16px;">
              Bestelling Geannuleerd / Order Cancelled
            </div>

            <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #14120F;">
              Beste ${full_name || 'Klant'},
            </h2>

            <p style="font-size: 14px; line-height: 1.6; color: #44403C; margin: 0 0 18px 0;">
              Helaas moeten wij u mededelen dat uw bestelling <strong>#${shortId}</strong> ${delivery_type ? `(${delivery_type})` : ''} niet verwerkt kan worden en is geannuleerd.
            </p>

            <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #991B1B; letter-spacing: 0.5px;">
                Reden van annulering / Reason for cancellation:
              </p>
              <p style="margin: 0; font-size: 15px; color: #7F1D1D; font-weight: 600;">
                ${reason || 'Onvoorziene omstandigheden in het restaurant / Unforeseen circumstances.'}
              </p>
            </div>

            ${formattedTotal ? `
            <div style="background-color: #F9F8F6; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; color: #57534E;">
              <strong>Totaalbedrag:</strong> ${formattedTotal}
            </div>` : ''}

            <p style="font-size: 13px; line-height: 1.5; color: #78716C; margin: 0 0 16px 0;">
              Mocht u reeds online betaald hebben, dan wordt het bedrag zo spoedig mogelijk teruggestort op uw rekening. Heeft u vragen over uw bestelling? Neem gerust telefonisch contact met ons op via <a href="tel:022697176" style="color: #D62828; text-decoration: none; font-weight: bold;">02 269 71 76</a>.
            </p>

            <p style="font-size: 13px; line-height: 1.5; color: #78716C; margin: 0;">
              Onze oprechte excuses voor het ongemak.<br>
              <strong>Het Pizza Town Team</strong>
            </p>
          </div>

          <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #A8A29E;">
            Pizza Town Meise • Stationsstraat 14, 1861 Meise • Tel: 02 269 71 76
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order cancellation email successfully sent: %s to %s', info.messageId, toEmail);
    return true;
  } catch (error) {
    console.error('Error sending order cancellation email:', error);
    return false;
  }
};


