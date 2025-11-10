import { env } from "@/env";
import { Resend } from "resend";

const globalForEmail = globalThis as unknown as {
  resend: Resend;
};

export const emailClient =
  globalForEmail.resend || new Resend(env.RESEND_API_KEY);

if (process.env.NODE_ENV !== "production") globalForEmail.resend = emailClient;
