import { Resend } from 'resend';

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'onboarding@resend.dev', // replace with your domain later
    to,
    subject,
    html,
  });

  console.log('📧 Sending email to:', to);
  console.log('Subject:', subject);
  console.log('HTML:', html);
}