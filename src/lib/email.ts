import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');

export async function sendVerificationEmail(to: string, code: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV MODE] Verification code for ${to}: ${code}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'Auth <onboarding@resend.dev>', // Update with a verified domain if needed
      to,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
          <h2>Verify your account</h2>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 20px; background: #f4f4f5; border-radius: 8px; margin: 20px 0;">
            ${code}
          </div>
          <p>This code will expire in 15 minutes.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    console.log(`[FALLBACK] Since email failed, here is the code for ${to}: ${code}`);
  }
}

export async function sendAdminNewUserNotification(adminEmail: string, newUserName: string, newUserEmail: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV MODE] Admin notification: New user registered: ${newUserName} (${newUserEmail})`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'System <onboarding@resend.dev>',
      to: adminEmail,
      subject: 'New User Registration - Action Required',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2>New User Registration</h2>
          <p>A new user has registered and is pending your approval:</p>
          <ul>
            <li><strong>Name:</strong> ${newUserName}</li>
            <li><strong>Email:</strong> ${newUserEmail}</li>
          </ul>
          <p>Please log in to the admin panel to approve or reject this user.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
  }
}

export async function sendAdminHotelRequestNotification(adminEmail: string, requestDetails: { name: string, city: string | null, user: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV MODE] Admin notification: New hotel request: ${requestDetails.name} from ${requestDetails.user}`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'System <onboarding@resend.dev>',
      to: adminEmail,
      subject: 'New Hotel Request',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2>New Hotel Request</h2>
          <p>A user has requested a new hotel to be added:</p>
          <ul>
            <li><strong>Hotel Name:</strong> ${requestDetails.name}</li>
            <li><strong>Location:</strong> ${requestDetails.city || 'Not specified'}</li>
            <li><strong>Requested By:</strong> ${requestDetails.user}</li>
          </ul>
          <p>Please log in to the admin panel to review this request.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send hotel request notification:', error);
  }
}

export async function sendHotelApprovedEmail(to: string, hotelName: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV MODE] Email to ${to}: Your requested hotel "${hotelName}" has been approved and added.`);
    return;
  }

  try {
    await resend.emails.send({
      from: 'System <onboarding@resend.dev>',
      to,
      subject: 'Your Hotel Request was Approved!',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; text-align: center;">
          <h2>Good News!</h2>
          <p>Your request to add the hotel <strong>${hotelName}</strong> has been approved.</p>
          <p>It is now available for search and reviews in our database.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send hotel approval email:', error);
    console.log(`[FALLBACK] Email to ${to}: Your requested hotel "${hotelName}" has been approved and added.`);
  }
}
