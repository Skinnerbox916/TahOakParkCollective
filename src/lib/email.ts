import { Resend } from 'resend';
import { MagicLinkPurpose } from '@/lib/prismaEnums';

// Mock Resend client for development when RESEND_API_KEY is not set
// This allows development/testing without a live email service
const apiKey = process.env.RESEND_API_KEY;
const resend: Pick<Resend, 'emails'> = apiKey
  ? new Resend(apiKey)
  : {
      emails: {
        // Mock email sending that mimics the real client when no API key is set
        send: async (params: Parameters<Resend['emails']['send']>[0]) => {
          console.log('[MOCK EMAIL]', JSON.stringify(params, null, 2));
          return { data: { id: 'mock_id' }, error: null };
        }
      }
    };

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@tahoak.skibri.us';

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL}/subscribe/verify?token=${token}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verify your TahOak Park Collective subscription',
      html: `
        <h1>Confirm your subscription</h1>
        <p>Click the link below to verify your email address and subscribe to updates:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>This link will expire in 7 days.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}

export async function sendMagicLinkEmail(
  email: string, 
  token: string, 
  purpose: MagicLinkPurpose,
  entityId?: string
) {
  let subject = '';
  let urlPath = '';
  
  switch (purpose) {
    case MagicLinkPurpose.MANAGE_PREFERENCES:
      subject = 'Manage your TahOak Park Collective preferences';
      urlPath = `/subscribe/manage?token=${token}`;
      break;
    case MagicLinkPurpose.CLAIM_ENTITY:
      subject = 'Verify your entity claim for TahOak Park Collective';
      urlPath = entityId 
        ? `/public/claim/verify?token=${token}&entityId=${entityId}`
        : `/public/claim/verify?token=${token}`;
      break;
    case MagicLinkPurpose.VERIFY_SUBSCRIPTION:
      subject = 'Verify your TahOak Park Collective subscription';
      urlPath = `/subscribe/verify?token=${token}`;
      break;
    default:
      throw new Error('Unsupported magic link purpose');
  }
  
  const url = urlPath.startsWith('http') 
    ? urlPath 
    : `${process.env.NEXTAUTH_URL}${urlPath}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `
        <h1>${subject}</h1>
        <p>Click the link below to verify your identity:</p>
        <a href="${url}">${url}</a>
        <p>This link will expire in 7 days.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending magic link email:', error);
    return false;
  }
}

export async function sendNotificationEmail(email: string, subject: string, message: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html: `<p>${message}</p>`,
    });
    return true;
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

export async function sendClaimNotificationEmail(adminEmail: string, entityName: string, submitterEmail: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: `New Entity Claim Request for ${entityName}`,
      html: `
        <h1>New Entity Claim Request</h1>
        <p>A user (${submitterEmail}) has requested to claim the entity: <strong>${entityName}</strong>.</p>
        <p>Please review this claim in the admin dashboard.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Error sending claim notification email:', error);
    return false;
  }
}
