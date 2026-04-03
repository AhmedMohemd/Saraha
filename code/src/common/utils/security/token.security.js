import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { findOne, UserModel } from "../../../DB/index.js";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../response/index.js";
import { SignatureLevelEnum, TokenTypeEnum } from "../../enums/index.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_USER_TOKEN_SIGNATURE,
  ACCESS_SYSTEM_TOKEN_SIGNATURE,
  REFRESH_USER_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_SYSTEM_TOKEN_SIGNATURE,
} from "../../../../config/config.service.js";
import { get, revokeTokenKey, set } from "../../services/index.js";
export const privileges = (user) => {
  const privs = Array.isArray(user.privileges) ? user.privileges : [];
  return privs.map((pre) => pre.code);
};
export const generateToken = async ({
  payload,
  secret = ACCESS_USER_TOKEN_SIGNATURE,
  options = { expiresIn: Number(ACCESS_TOKEN_EXPIRES_IN) },
} = {}) => {
  return jwt.sign(payload, secret, options);
};
export const verifyToken = async ({
  token,
  secret = ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
  return jwt.verify(token, secret);
};
export const detectSignatureLevel = async (system) => {
  let signatureLevel = SignatureLevelEnum.Bearer;
  switch (system) {
    case true:
      signatureLevel = SignatureLevelEnum.System;
      break;
    default:
      signatureLevel = SignatureLevelEnum.Bearer;
      break;
  }
  return signatureLevel;
};
export const getSignatures = async (signatureLevel) => {
  let level = signatureLevel;
  if (typeof signatureLevel === "string") {
    level =
      signatureLevel.toLowerCase() === "bearer"
        ? SignatureLevelEnum.Bearer
        : SignatureLevelEnum.System;
  }
  const signatures = { access_signature: "", refresh_signature: "" };
  switch (level) {
    case SignatureLevelEnum.System:
      signatures.access_signature = ACCESS_SYSTEM_TOKEN_SIGNATURE;
      signatures.refresh_signature = REFRESH_SYSTEM_TOKEN_SIGNATURE;
      break;
    default:
      signatures.access_signature = ACCESS_USER_TOKEN_SIGNATURE;
      signatures.refresh_signature = REFRESH_USER_TOKEN_SIGNATURE;
      break;
  }
  return signatures;
};
export const createLoginCredentials = async (user) => {
  const signatureLevel = await detectSignatureLevel(
    privileges(user).some((code) => code >= 8000),
  );
  const signatures = await getSignatures(signatureLevel);
  console.log({ signatures });
  const jwtid = randomUUID();
  const access_token = await generateToken({
    payload: { _id: user._id },
    secret: signatures.access_signature,
    options: { expiresIn: Number(ACCESS_TOKEN_EXPIRES_IN), jwtid },
  });
  const refresh_token = await generateToken({
    payload: { _id: user._id },
    secret: signatures.refresh_signature,
    options: { expiresIn: Number(REFRESH_TOKEN_EXPIRES_IN), jwtid },
  });
  return { access_token, refresh_token };
};
export const decodeToken = async ({
  authorization,
  tokenType = TokenTypeEnum.Access,
  lang = "ar",
} = {}) => {
  const [bearerKey, token] = authorization.split(" ");
  if (!bearerKey || !token) {
    return UnauthorizedException({
      message:
        lang == "en"
          ? "missing token parts"
          : "برجاء ادخل ال authorization  بشكل صحيح ",
    });
  }
  const signatures = await getSignatures(bearerKey);
  console.log({ signatures });
  const decoded = await verifyToken({
    token,
    secret:
      tokenType === TokenTypeEnum.Refresh
        ? signatures.refresh_signature
        : signatures.access_signature,
  });
  if (!decoded?._id || !decoded?.iat) {
    return BadRequestException({
      message:
        lang == "en" ? "invalid token payload" : "خطاء في محتوي ال token",
    });
  }
  if (
    decoded.jti &&
    (await get(revokeTokenKey({ userId: decoded._id, jti: decoded.jti })))
  ) {
    return UnauthorizedException({
      message:
        lang == "en"
          ? "invalid or old login credentials kindly login again"
          : "عفوا لاكن هذه السشن منتهيه الصلاحيه برجاء اعاده  تسجيل الدخول من جديد",
    });
  }
  const user = await findOne({
    model: UserModel,
    filter: { _id: decoded._id },
    options: {
      populate: [{ path: "privileges", select: "code", strictPopulate: false }],
    },
  });
  if (!user) {
    return NotFoundException({
      message: lang == "en" ? "Not registered account" : "حساب غير مسجل",
    });
  }
  if ((user.changeCredentialTime?.getTime() || 0) > decoded.iat * 1000) {
    return NotFoundException({
      message: lang == "en" ? "Not registered account" : "حساب غير مسجل",
    });
  }

  return { user, decoded };
};
export const createRevokeToken = async (decoded) => {
  await set(
    revokeTokenKey(decoded._id, decoded.jti),
    decoded.jti,
    decoded.iat + Number(REFRESH_TOKEN_EXPIRES_IN),
  );
};
