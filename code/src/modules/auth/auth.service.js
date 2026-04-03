import { ProviderEnum, EmailEnum } from "../../common/enums/index.js";
import {
  ConflictException,
  generateHash,
  NotFoundException,
  generateEncrypt,
  createLoginCredentials,
  BadRequestException,
  emailTemplate,
  createNumberOtp,
  sendEmail,
  emailEvent,
  compareHash,
} from "../../common/utils/index.js";
import {
  UserModel,
  createOne,
  findOne,
  findOneAndUpdate,
} from "../../DB/index.js";
import { OAuth2Client } from "google-auth-library";
import {
  blockotpKey,
  deletekeys,
  baseRevokeTokenKey,
  incr,
  ttl,
  get,
  set,
  keys,
  maxAttempOtpKey,
  otpKey,
} from "../../common/services/index.js";
import { compare } from "bcrypt";

export const sendEmailOtp = async ({ email, subject, title } = {}) => {
  const blockKey = blockotpKey({ email, subject });
  const otpKeyName = otpKey({ email, subject });
  const maxTrialKeyName = maxAttempOtpKey({ email, subject });
  const blockTTL = await ttl(blockKey);
  if (blockTTL <= 0) {
    await deletekeys([blockKey, maxTrialKeyName, otpKeyName]);
  }
  const isBlockedTTL = await ttl(blockKey);
  if (isBlockedTTL > 0) {
    throw BadRequestException({
      message: `Sorry we cannot request new otp while are blocked please try again after ${isBlockedTTL}`,
    });
  }
  const remainingOtpTTL = await ttl(otpKeyName);
  if (remainingOtpTTL > 0) {
    throw BadRequestException({
      message: `Sorry we cannot request new otp while current otp still active please try again after ${remainingOtpTTL}`,
    });
  }
  const maxTrial = await get(maxTrialKeyName);
  if (maxTrial > 3) {
    await set({ key: blockKey, value: 1, ttl: 7 * 60 });
    throw BadRequestException({ message: `you have reached the max trial` });
  }
  const code = await createNumberOtp();
  await set({
    key: otpKeyName,
    value: await generateHash({ plaintext: `${code}` }),
    ttl: 120,
  });
  emailEvent.emit("sendEmail", async () => {
    await sendEmail({
      to: email,
      subject,
      html: emailTemplate({ code, title }),
    });
    const count = await incr(maxTrialKeyName);
    if (count === 1) await expire({ key: maxTrialKeyName, ttl: 120 });
  });
};
export const signup = async (inputs) => {
  const { username, email, password, phone } = inputs;
  const normalizedEmail = email.toLowerCase();
  const checkUserExist = await findOne({
    model: UserModel,
    filter: { email: normalizedEmail },
  });
  if (checkUserExist) {
    throw ConflictException({ message: "Email Exist" });
  }
  const user = await createOne({
    model: UserModel,
    data: {
      username,
      email: normalizedEmail,
      password: await generateHash({ plaintext: password }),
      phone: await generateEncrypt(phone),
      provider: ProviderEnum.System,
    },
    options: { lean: true },
  });
  let s = { message: "User created successfully", user };
  console.log(s);
  await sendEmailOtp({
    email: normalizedEmail,
    subject: EmailEnum.ConfirmEmail,
    title: "verify email",
  });
  console.log(s);
  return user;
};
export const confirmEmail = async (inputs) => {
  const { email, otp } = inputs;
  const normalizedEmail = email.toLowerCase();
  const account = await findOne({
    model: UserModel,
    filter: {
      email: normalizedEmail,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });
  if (!account) {
    throw NotFoundException({ message: "fail to find matching account" });
  }
  const hashOtp = await get(
    otpKey({ email: normalizedEmail, subject: EmailEnum.ConfirmEmail }),
  );
  if (!hashOtp) {
    throw NotFoundException({ message: "Expired otp" });
  }
  if (!(await compareHash({ plaintext: otp, cipherText: hashOtp }))) {
    throw ConflictException({ message: "Invalid otp" });
  }
  account.confirmEmail = new Date();
  await account.save();
  await deletekeys(
    await keys(
      otpKey({ email: normalizedEmail, subject: EmailEnum.ConfirmEmail }),
    ),
  );
  return;
};
export const resendconfirmEmail = async (inputs) => {
  const { email } = inputs;
  const normalizedEmail = email.toLowerCase();
  const account = await findOne({
    model: UserModel,
    filter: {
      email: normalizedEmail,
      confirmEmail: { $exists: false },
      provider: ProviderEnum.System,
    },
  });
  if (!account) {
    throw NotFoundException({ message: "fail to find matching account" });
  }
  await sendEmailOtp({
    email: normalizedEmail,
    subject: EmailEnum.ConfirmEmail,
    title: "verify email",
  });
  return;
};
export const requestForgotPassword = async (inputs) => {
  const { email } = inputs;
  const normalizedEmail = email.toLowerCase();
  const account = await findOne({
    model: UserModel,
    filter: {
      email: normalizedEmail,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.System,
    },
  });
  if (!account) {
    throw NotFoundException({ message: "fail to find matching account" });
  }
  await sendEmailOtp({
    email: normalizedEmail,
    subject: EmailEnum.ForgotPassword,
    title: "reset code",
  });
  return;
};
export const verifyForgotPasswordOtp = async (inputs) => {
  const { email, otp } = inputs;
  const hashOtp = await get(
    otpKey({ email, subject: EmailEnum.ForgotPassword }),
  );
  if (!hashOtp) {
    throw NotFoundException({ message: "Expired otp" });
  }
  if (!(await compareHash({ plaintext: otp, cipherText: hashOtp }))) {
    throw ConflictException({ message: "Invalid otp" });
  }
  return;
};
export const resetForgotPasswordOtp = async (inputs) => {
  const { email, otp, password } = inputs;
  const normalizedEmail = email.toLowerCase();
  await verifyForgotPasswordOtp({ email: normalizedEmail, otp });
  const user = await findOneAndUpdate({
    model: UserModel,
    filter: {
      email: normalizedEmail,
      confirmEmail: { $exists: true },
      provider: ProviderEnum.System,
    },
    update: {
      password: await generateHash({ plaintext: password }),
      changeCredentialTime: new Date(),
    },
    options: { new: true },
  });
  if (!user) {
    throw NotFoundException({ message: "account not exist or update failed" });
  }
  const otpKeys = await keys(
    otpKey({ email: normalizedEmail, subject: EmailEnum.ForgotPassword }),
  );
  const tokenKeys = await keys(baseRevokeTokenKey(user._id));
  await deletekeys([...otpKeys, ...tokenKeys]);
  return;
};
export const login = async (inputs, issuer) => {
  const { email, password } = inputs;
  const normalizedEmail = email.toLowerCase();
  const user = await findOne({
    model: UserModel,
    filter: { email: normalizedEmail },
    options: { lean: true },
  });
  if (!user) {
    throw NotFoundException({ message: "Invalid Login Credentials" });
  }
  if (!(await compare(password, user.password))) {
    throw NotFoundException({ message: "Invalid Login Credentials" });
  }
  return createLoginCredentials(user, issuer);
};
const verifyGoogleAccount = async (idToken) => {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience:
      "415054717796-5uln7idk86ggssc75jgv456ivq9eg98j.apps.googleusercontent.com",
  });
  const payload = ticket.getpPayload();
  if (!payload?.email_verified) {
    throw BadRequestException({ messeage: "fall to verify by google" });
  }
  return payload;
};
export const loginWithGmail = async (idToken, issuer) => {
  const payload = await verifyGoogleAccount(idToken);
  console.log(payload);

  const user = await findOne({
    model: UserModel,
    filter: { email: payload.email, provider: ProviderEnum.Google },
  });
  if (!user) {
    throw NotFoundException({ message: "Not registered account" });
  }
  return await createLoginCredentials(user, issuer);
};
export const signupWithGmail = async (idToken, issuer) => {
  const payload = await verifyGoogleAccount(idToken);
  console.log(payload);
  const checkExist = await findOne({
    model: UserModel,
    filter: { email: payload.email },
  });
  if (checkExist) {
    if (checkExist.provider != ProviderEnum.Google) {
      throw ConflictException({ message: "Invalid login provider" });
    }
    return { status: 200, credentials: await loginWithGmail(idToken, issuer) };
  }
  const user = await createOne({
    model: UserModel,
    data: {
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      profilePicture: payload.picture,
      confirmEmail: new Date(),
      provider: ProviderEnum.Google,
    },
  });
  return {
    status: 201,
    credentials: await createLoginCredentials(user, issuer),
  };
};