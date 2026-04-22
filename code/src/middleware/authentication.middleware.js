
import { TokenTypeEnum } from "../common/enums/index.js";
import {
  BadRequestException,
  decodeToken,
  ForbiddenException,
  UnauthorizedException,
} from "../common/utils/index.js";
export const authentication = (TokenType = TokenTypeEnum.Access) => {
  return async (req, res, next) => {
    try {
      const authorization = req.headers.authorization;
      if (!authorization)
        throw UnauthorizedException({
          message: "Missing authorization header",
        });
      const [schema, credentials] = authorization.split(" ");
      if (!schema || !credentials)
        throw UnauthorizedException({ message: "Invalid format" });

      switch (schema.toLowerCase()) {
        case "bearer":
          const result = await decodeToken({
            authorization: `${schema} ${credentials}`,
            tokenType: TokenType,
          });
          if (result instanceof Error) throw result;
          req.user = result.user;
          req.decoded = result.decoded;
          break;
        default:
          throw BadRequestException({
            message: `Unsupported schema: ${schema}`,
          });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
export const authorization = (accessRoles = []) => {
  return async (req, res, next) => {
    if (!req.user || !accessRoles.includes(req.user.role)) {
      throw ForbiddenException({
        message: "Not Authorized Account",
      });
    }
    next();
  };
};