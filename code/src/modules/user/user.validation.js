import joi from "joi";
import { generalValidationFields } from "../../common/utils/index.js";
import { fileFieldValidation } from "../../common/utils/index.js";

export const updatePassword = {
  body: joi
    .object()
    .keys({
      oldPassword: generalValidationFields.password.required(),
      password: generalValidationFields.password
        .not(joi.ref("oldPassword"))
        .required(),
      confirmPassword: generalValidationFields
        .confirmPassword("password")
        .required(),
    })
    .required(),
};

export const shareProfile = {
  params: joi
    .object()
    .keys({
      userId: generalValidationFields.id.required(),
    })
    .required(),
};

export const profileImage = {
  file: generalValidationFields.file(fileFieldValidation.image).required(),
};

export const profileCoverImage = {
  files: joi
    .array()
    .items(generalValidationFields.file(fileFieldValidation.image))
    .min(1)
    .max(2)
    .required(),
};

export const profileAttachments = {
  files: joi
    .object()
    .keys({
      profileImage: joi
        .array()
        .items(
          generalValidationFields.file(fileFieldValidation.image).required(),
        )
        .length(1)
        .required(),
      profileCoverImage: joi
        .array()
        .items(
          generalValidationFields.file(fileFieldValidation.image).required(),
        )
        .min(1)
        .max(2)
        .required(),
    })
    .required(),
};

export const restoreAccount = {
  params: joi
    .object()
    .keys({
      userId: generalValidationFields.id.required(),
    })
    .required(),
};

export const deleteAccount = {
  params: joi
    .object()
    .keys({
      userId: generalValidationFields.id.required(),
    })
    .required(),
};
