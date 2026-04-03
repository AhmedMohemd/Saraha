import { BadRequestException } from "../common/utils/index.js";

export const validation = (schema) => {
  return (req, res, next) => {
    if (!schema || typeof schema !== "object") {
      return next();
    }

    const errors = [];

    // Body validation
    if (schema.body) {
      const result = schema.body.validate(req.body || {}, {
        abortEarly: false,
      });
      if (result.error) errors.push(...result.error.details);
    }

    // Files validation (للـ cover image)
    if (schema.files) {
      const filesToValidate = req.files || [];
      const result = schema.files.validate(filesToValidate, {
        abortEarly: false,
      });
      if (result.error) errors.push(...result.error.details);
    }

    // Single file validation (للـ profile image)
    if (schema.file) {
      const result = schema.file.validate(req.file, { abortEarly: false });
      if (result.error) errors.push(...result.error.details);
    }

    // Params validation
    if (schema.params) {
      const result = schema.params.validate(req.params || {}, {
        abortEarly: false,
      });
      if (result.error) errors.push(...result.error.details);
    }

    if (errors.length > 0) {
      console.log("🔥 Validation Errors:", errors);
      return next(
        BadRequestException({
          message: "validation error",
          extra: errors,
        }),
      );
    }

    next();
  };
};
