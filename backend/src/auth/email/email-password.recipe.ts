import EmailPassword from 'supertokens-node/recipe/emailpassword';
import { EmailPasswordHelper } from "./email-password.helper";

export function buildEmailPasswordRecipe(helper: EmailPasswordHelper) {
  return EmailPassword.init({
    emailDelivery: {
      override: (originalImplementation) => ({
        ...originalImplementation,
        sendEmail: async (input) => await helper.handleResetPassword(input),
      })
    },

    override: {
      functions: (originalImplementation) => ({
        ...originalImplementation, 
        signUp: (input) => helper.handleSignUp(input, originalImplementation),
        signIn: (input) => helper.handleSignIn(input, originalImplementation),
      })
    }
  })
}