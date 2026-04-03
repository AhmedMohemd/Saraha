import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../../../config/config.service.js";
import { LogoutEnum } from "../../common/enums/index.js";
import {
  findOneAndUpdate,
  findOneAndDelete,
  findOne,
  UserModel,
} from "../../DB/index.js";
import {
  compareHash,
  ConflictException,
  createLoginCredentials,
  createRevokeToken,
  generateDecryption,
  generateHash,
  NotFoundException,
} from "../../common/utils/index.js";
import {
  baseRevokeTokenKey,
  deletekeys,
  keys,
  revokeTokenKey,
  set,
} from "../../common/services/index.js";

export const shareProfile = async (userId) => {
  const account = await findOne({
    model: UserModel,
    filter: { _id: userId },
    select: "-password",
  });
  if (!account) {
    throw NotFoundException({ message: "Invalid shred account" });
  }
  if (account.phone) {
    account.phone = await generateDecryption(account.phone);
  }
  return account;
};

export const profile = async (user) => {
  // const account = await decodeToken({ token });
  return user;
};

export const profileImage = async (file, user) => {
  user.profilePicture = file.finalPath;
  await user.save();
  return user;
};
export const profileCoverImage = async (files, user) => {
  user.coverProfilePicture = files.map((file) => file.finalPath);
  await user.save();
  return user;
};
export const logout = async ({ flag }, user, { jti, iat, sub }) => {
  let status = 200;
  switch (flag) {
    case LogoutEnum.All:
      user.changeCredentialTime = new Date();
      await user.save();
      // await deletekeys({ model: tokenModel, filter: { userId: user._id } });
      await deletekeys(await keys(baseRevokeTokenKey(sub)));
      break;

    default:
      await createRevokeToken({
        userId: sub,
        jti,
        ttl: iat + REFRESH_TOKEN_EXPIRES_IN,
      });
      status = 201;
      break;
  }
  // user.changeCredentialTime = new Date();
  // await user.save();
  return status;
};
export const rotateToken = async (user, { sub, jti, iat }, issuer) => {
  if ((iat + ACCESS_TOKEN_EXPIRES_IN) * 100 >= Date.now() + 30000) {
    throw ConflictException({ messeage: "current access token still valid" });
  }
  await createRevokeToken({
    userId: sub,
    jti,
    iat,
    ttl: iat + REFRESH_TOKEN_EXPIRES_IN,
  });
  return createLoginCredentials(user, issuer);
};
export const updatePassword = async (
  { oldPassword, password },
  user,
  issuer,
) => {
  if (
    !(await compareHash({ plaintext: oldPassword, cipherText: user.password }))
  ) {
    throw ConflictException({ message: "invalid old password" });
  }

  for (const hash of user.oldPassword || []) {
    if (await compareHash({ plaintext: password, cipherText: hash })) {
      throw ConflictException({
        message: "This password is already used before",
      });
    }
  }
  user.oldPassword.push(user.password);
  user.password = await generateHash({ plaintext: password });
  user.changeCredentialTime = new Date();
  await user.save();
  await deletekeys(await keys(baseRevokeTokenKey(user._id)));
  return createLoginCredentials(user, issuer);
};
export const deleteAccount = async (userId) => {
  const user = await findOneAndDelete({
    model: UserModel,
    filter: { _id: userId },
  });
  if (!user) throw NotFoundException({ message: "User not found" });
  return user;
};

export const restoreAccount = async (userId) => {
  const user = await findOneAndUpdate({
    model: UserModel,
    filter: { _id: userId, deletedAt: { $ne: null } },
    update: { $unset: { deletedAt: 1 } },
    options: { new: true },
  });
  if (!user)
    throw NotFoundException({ message: "User not found or already active" });
  return user;
};
