import { hash, genSalt } from "bcrypt";
import { SALT_ROUND } from "../../../../config/config.service.js";
export const generateHash = async ({
  plaintext,
  salt = SALT_ROUND,
  minor = "b",
} = {}) => {
  const genrateSalt = await genSalt(salt, minor);
  return await hash(plaintext, genrateSalt);
};
