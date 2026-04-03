import { redisClient } from "../../DB/index.js";
import { EmailEnum } from "../enums/email.enum.js";
export const otpKey = ({ email, subject = EmailEnum.ConfirmEmail } = {}) => {
  return `OTP::User::${email}::${subject}`;
};
export const blockotpKey = ({
  email,
  subject = EmailEnum.ConfirmEmail,
} = {}) => {
  return `${otpKey({ email, subject })}::Block`;
};
export const maxAttempOtpKey = ({
  email,
  subject = EmailEnum.ConfirmEmail,
} = {}) => {
  return `${otpKey({ email, subject })}::MaxTrial`;
};
export const baseRevokeTokenKey = (userId) => {
  if (!userId) {
    throw new Error("baseRevokeTokenKey: userId is required");
  }
  return `REVOKE_TOKEN::User::${userId.toString()}`;
};
export const revokeTokenKey = ({ userId, jti } = {}) => {
  if (!userId) {
    throw new Error("revokeTokenKey: userId is required");
  }
  if (!jti) {
    throw new Error("revokeTokenKey: jti is required");
  }
  return `${baseRevokeTokenKey(userId)}::${jti.toString()}`;
};
export const set = async ({ key, value, ttl } = {}) => {
  try {
    value = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, value, { EX: ttl })
      : await redisClient.set(key, value);
  } catch (error) {
    console.log(`Fail to set this redis query : ${error}`);
  }
};
export const update = async ({ key, value, ttl } = {}) => {
  try {
    if (!(await redisClient.exists(key))) return 0;
    return await set({ key, value, ttl });
  } catch (error) {
    console.log(`Fail to update this redis query : ${error}`);
  }
};
export const get = async (key) => {
  try {
    try {
      return JSON.parse(await redisClient.get(key));
    } catch (error) {
      return await redisClient.get(key);
    }
  } catch (error) {
    console.log(`Fail to get this redis query : ${error}`);
  }
};
export const ttl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log(`Fail to ttl this redis query : ${error}`);
  }
};
export const exists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.log(`Fail to exists this redis query : ${error}`);
  }
};
export const incr = async (key) => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.log(`Fail to incr this redis query : ${error}`);
  }
};
export const expire = async ({ key, ttl } = {}) => {
  try {
    return await redisClient.expire(key, ttl);
  } catch (error) {
    console.log(`Fail to add-expire this redis query : ${error}`);
  }
};
export const mGet = async (keys = []) => {
  try {
    if (!keys.length) return 0;
    return await redisClient.mGet(keys);
  } catch (error) {
    console.log(`Fail to mGet this redis query : ${error}`);
  }
};
export const keys = async (prefix) => {
  try {
    return await redisClient.keys(`${prefix}`);
  } catch (error) {
    console.log(`Fail to keys this redis query : ${error}`);
  }
};
export const deletekeys = async (keys) => {
  try {
    if (!keys.length) return 0;
    return await redisClient.del(keys);
  } catch (error) {
    console.log(`Fail to deletekeys this redis query : ${error}`);
  }
};
