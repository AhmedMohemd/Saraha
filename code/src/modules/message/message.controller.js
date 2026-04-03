import { Router } from "express";
import {
  BadRequestException,
  decodeToken,
  fileFieldValidation,
  localFileUpload,
  SuccessResponse,
} from "../../common/utils/index.js";
import { deleteMessage, getMessage, getMessages, sendMessage } from "./message.service.js";
import * as validators from "./message.validation.js";
import { TokenTypeEnum } from "../../common/enums/index.js";
import { authentication, validation } from "../../middleware/index.js";

const router = Router();

router.post(
  "/:receiverId",
  async (req, res, next) => {
    if (req.headers.authorization) {
      const { user, decoded } = await decodeToken({
        authorization: req.headers.authorization,
        tokenType: TokenTypeEnum.Access,
      });
      req.user = user;
      req.decoded = decoded;
    }
    next();
  },
  localFileUpload({
    validation: fileFieldValidation.image,
    customPath: "messages",
    maxSize: 10,
  }).array("attachments", 2),
  validation(validators.sendMessage),
  async (req, res, next) => {
    if (!req.body?.content && !req.files?.length) {
      throw BadRequestException({
        message: "validation error",
        extra: [{ key: "body", path: ["content"], message: "missing content" }],
      });
    }

    const message = await sendMessage(
      req.params.receiverId,
      req.body,
      req.files,
      req.user,
    );

    return SuccessResponse({ res, status: 201, data: { message } });
  },
);
router.get(
  "/list",
  authentication(),
  async (req, res, next) => {
    const messages = await getMessages( req.user);
    return SuccessResponse({ res, status: 200, data: { messages } });
  },
);
router.get(
  "/:messageId",
  authentication(),
  validation(validators.getMessage),

  async (req, res, next) => {
    const message = await getMessage(req.params.messageId, req.user);
    return SuccessResponse({ res, status: 200, data: { message } });
  },
);
router.delete(
  "/:messageId",
  authentication(),
  validation(validators.getMessage),

  async (req, res, next) => {
    const message = await deleteMessage(req.params.messageId, req.user);
    return SuccessResponse({ res, status: 200, data: { message } });
  },
);
export default router;
