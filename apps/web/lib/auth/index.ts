import { db } from "@/lib/db";
import { schema } from "@workspace/database/server";

import OrganizationInvitationEmail from "@/components/auth/emails/organization-invitation";
import ForgotPasswordEmail from "@/components/auth/emails/reset-password";
import VerifyEmail from "@/components/auth/emails/verify-email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { admin, member, owner } from "./permissions";
import { emailClient } from "@/lib/email";
import { env } from "@/env";

export const auth = betterAuth({
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await emailClient.emails.send({
        from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: "Verify your email",
        react: VerifyEmail({ username: user.name, verifyUrl: url }),
      });
    },
    sendOnSignUp: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await emailClient.emails.send({
        from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: "Reset your password",
        react: ForgotPasswordEmail({
          username: user.name,
          resetUrl: url,
          userEmail: user.email,
        }),
      });
    },
    requireEmailVerification: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    organization({
      async sendInvitationEmail(data) {
        const inviteLink = `${env.NEXT_PUBLIC_APP_URL}/api/accept-invitation/${data.id}`;

        await emailClient.emails.send({
          from: `${env.EMAIL_SENDER_NAME} <${env.EMAIL_SENDER_ADDRESS}>`,
          to: data.email,
          subject: "You've been invited to join our organization",
          react: OrganizationInvitationEmail({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          }),
        });
      },
      roles: {
        owner,
        admin,
        member,
      },
    }),
    nextCookies(),
  ],
  advanced: {
    defaultCookieAttributes: {
      domain: env.BETTER_AUTH_DOMAIN, // <-- important: share across subdomains
      secure: true, // required for HTTPS
      sameSite: "lax", // allow cross-subdomain navigation
      httpOnly: true, // keep it safe from JS access
    },
  },
});
