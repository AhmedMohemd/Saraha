import { Router } from "express";
import {
  deleteAccount,
  logout,
  profile,
  profileCoverImage,
  profileImage,
  rotateToken,
  shareProfile,
  updatePassword,
} from "./user.service.js";
import { SuccessResponse } from "../../common/utils/response/index.js";
import { authentication, authorization } from "../../middleware/index.js";
import { TokenTypeEnum } from "../../common/enums/index.js";
import { endPoint } from "./user.authorization.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js";
import {
  fileFieldValidation,
  localFileUpload,
} from "../../common/multer/index.js";

const router = Router();
router.get(
  "/",
  authentication(),
  authorization(endPoint.profile),
  async (req, res, next) => {
    const account = await profile(req.user);
    return SuccessResponse({ res, data: { account } });
  },
);
router.get(
  "/:userId/share-profile",
  validation(validators.shareProfile),
  async (req, res, next) => {
    const account = await shareProfile(req.params.userId);
    return SuccessResponse({ res, data: { account } });
  },
);
router.post(
  "/rotate-token",
  authentication(TokenTypeEnum.Refresh),
  async (req, res, next) => {
    const credentials = await rotateToken(
      req.user,
      req.decoded,
      `${req.protocol}://${req.host}`,
    );
    return SuccessResponse({ res, status: 201, data: { ...credentials } });
  },
);
router.post(
  "/logout",
  authentication(),

  async (req, res, next) => {
    const status = await logout(req.body, req.user, req.decoded);
    return SuccessResponse({ res, status });
  },
);
router.patch(
  "/password",
  authentication(),
  validation(validators.updatePassword),
  async (req, res, next) => {
    const credentionls = await updatePassword(
      req.body,
      req.user,
      `${req.protocol}://${req.host}`,
    );
    return SuccessResponse({ res, data: { ...credentionls } });
  },
);

///////////////////////////////
router.patch(
  "/profile-image",
  authentication(),

  localFileUpload({
    customPath: "users/profile",
    validation: fileFieldValidation.image,
    // validation: [...fileFieldValidation.image, fileFieldValidation.video[0]],
    maxSize: 5,
  }).single("attachment"),
  validation(validators.profileImage),

  async (req, res, next) => {
    console.log("FILE:", req.file);
    const account = await profileImage(req.file, req.user);
    return SuccessResponse({ res, data: { account } });
  },
);
//////////////////////////////

router.patch(
  "/profile-cover-image",
  authentication(),
  localFileUpload({
    customPath: "users/profile/cover",
    validation: fileFieldValidation.image,
    maxSize: 5,
  }).array("attachments", 2),
  validation(validators.profileCoverImage),
  async (req, res, next) => {
    const account = await profileCoverImage(req.files, req.user);
    return SuccessResponse({ res, data: { account } });
  },
);
router.patch(
  "/:userId/restore-account",
  authentication(),
  authorization(endPoint.profile),
  validation(validators.restoreAccount),
  async (req, res, next) => {
    const account = await restoreAccount(req.params.userId);
    return SuccessResponse({ res, data: { account } });
  },
);

router.patch(
  "/:userId/restore-account",
  authentication(),
  authorization(endPoint.profile),
  validation(validators.restoreAccount),
  async (req, res, next) => {
    const account = await restoreAccount(req.params.userId);
    return SuccessResponse({ res, data: { account } });
  },
);

router.delete(
  "/:userId",
  authentication(),
  authorization(endPoint.profile),
  validation(validators.deleteAccount),
  async (req, res, next) => {
    const account = await deleteAccount(req.params.userId);
    return SuccessResponse({ res, data: { account } });
  },
);

export default router;
