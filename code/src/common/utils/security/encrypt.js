import crypto from "node:crypto";
import { compare } from "bcrypt";
import {
  ENC_SECRET_KEY,
  IV_LENGTH,
} from "../../../../config/config.service.js";
export const compareHash = async ({ plaintext, cipherText }) => {
  return await compare(plaintext, cipherText);
};
export const generateEncrypt = (plaintext) => {
  const iv = crypto.randomBytes(Number(process.env.IV_LENGTH) || 16);
  const cipherIV = crypto.createCipheriv("aes-256-cbc", ENC_SECRET_KEY, iv);
  let cipherText = cipherIV.update(plaintext, "utf-8", "hex");
  cipherText += cipherIV.final("hex");
  return `${iv.toString("hex")}:${cipherText}`;
};
export const generateDecryption = async (cipherText) => {
  const [iv, encryptedData] = cipherText.split(":") || [];
  const ivLikeBinary = Buffer.from(iv, "hex");
  const decipherIv = crypto.createDecipheriv(
    "aes-256-cbc",
    ENC_SECRET_KEY,
    ivLikeBinary,
  );
  let plaintext = decipherIv.update(encryptedData, "hex", "utf-8");
  plaintext += decipherIv.final("utf-8");
  console.log({ iv, encryptedData, ivLikeBinary, decipherIv, plaintext });
  return plaintext;
};