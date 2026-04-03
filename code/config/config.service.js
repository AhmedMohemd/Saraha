import { resolve } from "node:path";
import { config } from "dotenv";
export const NODE_ENV = process.env.NODE_ENV;
const envPath = {
  development: `.env.development`,
  production: `.env.production`,
};
console.log({ en: envPath[NODE_ENV] });
config({ path: resolve(`./config/${envPath[NODE_ENV]}`) });
export const port = process.env.PORT ?? 7000;
export const IV_LENGTH = process.env.IV_LENGTH;
export const DB_URI = process.env.DB_URI;
export const ACCESS_SYSTEM_TOKEN_SIGNATURE =
  process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE;
export const REFRESH_SYSTEM_TOKEN_SIGNATURE =
  process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE;
export const REFRESH_USER_TOKEN_SIGNATURE =
  process.env.REFRESH_USER_TOKEN_SIGNATURE;
export const ACCESS_USER_TOKEN_SIGNATURE =
  process.env.ACCESS_USER_TOKEN_SIGNATURE;
export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");
export const ACCESS_TOKEN_EXPIRES_IN = parseInt(
  process.env.ACCESS_TOKEN_EXPIRES_IN,
);
export const FACEBOOKLINK = process.env.FACEBOOKLINK;
export const INSTAGRAM = process.env.INSTAGRAM;
export const TWITTERLINK = process.env.TWITTERLINK;
export const REDIS_URI = process.env.REDIS_URI;
export const EMAIL_APP = process.env.EMAIL_APP;
export const APPLICATION_NAME = process.env.APPLICATION_NAME;
export const REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN);
export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
export const ORIGINS = process.env.ORIGINS?.split(',').map((origin) => origin.trim())||[];
export const ENC_SECRET_KEY = Buffer.from(process.env.ENC_SECRET_KEY);
