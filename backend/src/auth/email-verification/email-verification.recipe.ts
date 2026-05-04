import { sendEmail } from "src/auth/email/resend-service";
import EmailVerification from "supertokens-node/recipe/emailverification";

export function buildEmailVerificationRecipe() {
  return EmailVerification.init({
    mode: "REQUIRED",
    emailDelivery: {
      override: (originalImplementation) => ({
        ...originalImplementation,
        sendEmail: async (input) => {
          await sendEmail(
            input.user.email,
            "Verify your email",
            `
              <h2>Verify your email address</h2>
              <p>Click the link below to verify your email. This link expires in 24 hours.</p>
              <a href="${input.emailVerifyLink}">Verify Email</a>
              <p>If you didn't create an account, please ignore this email.</p>
            `,
          );
        },
      }),
    },
  });
}