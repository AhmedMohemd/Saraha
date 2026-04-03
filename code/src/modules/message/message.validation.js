import joi from "joi";
import {
  generalValidationFields,
  fileFieldValidation,
} from "../../common/utils/index.js";

export const sendMessage = {
  params: joi
    .object()
    .keys({
      receiverId: generalValidationFields.id.required(),
    })
    .required(),

  body: joi.object().keys({
    content: joi.string().min(2).max(10000),
  }),

  files: joi
    .array()
    .items(generalValidationFields.file(fileFieldValidation.image))
    .max(3),
};
