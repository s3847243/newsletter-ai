import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  mailgunApiKey: process.env.MAILGUN_API_KEY!,
  mailgunDomain: process.env.MAILGUN_DOMAIN!,
  mailgunFromEmail: process.env.MAILGUN_FROM_EMAIL!,
  sitePublicUrl: process.env.SITE_PUBLIC_URL!,
  openaiApiKey: process.env.OPENAI_API_KEY!,
  openaiModel: process.env.OPENAI_MODEL || "gpt-5-nano",
};
