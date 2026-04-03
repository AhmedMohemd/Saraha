import multer from "multer";
import { NODE_ENV } from "../../../../config/config.service.js";
export const ErrorResponse = ({
  message = "error",
  status = 400,
  extra = undefined,
}) => {
  throw new Error(message, { cause: { status, extra } });
};
export const BadRequestException = ({
  message = "Bad Requsest Exception",
  extra = undefined,
}) => {
  return ErrorResponse({ message, status: 400, extra });
};
export const ConflictException = ({
  message = "Conflict Exception",
  extra = undefined,
}) => {
  return ErrorResponse({ message, status: 409, extra });
};
export const UnauthorizedException = ({
  message = "Unauthorized Exception",
  extra = undefined,
}) => {
  return ErrorResponse({ message, status: 401, extra });
};
export const NotFoundException = ({
  message = "Not Found Exception",
  extra = undefined,
}) => {
  return ErrorResponse({ message, status: 404, extra });
};
export const ForbiddenException = ({
  message = "Forbidden Exception",
  extra = undefined,
}) => {
  return ErrorResponse({ message, status: 403, extra });
};
export const globalErrorHandling = (error, req, res, next) => {
  let status = error.cause.status ?? 500;
  const mode = NODE_ENV == "production";
  const defaultErrorMessage = "Server Error";
  const displayErrorMassage = error.message || dufaultErrorMassage;
  if (error instanceof multer.MulterError) {
    status = 400;
  }
  return res.status(status).json({
    status,
    errorMassage: mode
      ? status == 500
        ? defaultErrorMessage
        : defaultErrorMessage
      : displayErrorMassage,
    extra: error?.cause?.extra || undefined,
    stack: mode ? undefined : error.stack,
  });
};