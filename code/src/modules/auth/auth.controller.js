import { Router } from "express";
import {
  confirmEmail,
  login,
  requestForgotPassword,
  resendconfirmEmail,
  resetForgotPasswordOtp,
  signup,
  signupWithGmail,
  verifyForgotPasswordOtp,
} from "./auth.service.js";
import { SuccessResponse } from "../../common/utils/index.js";
import * as validators from "./auth.validation.js";
import { validation } from "../../middleware/index.js";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import geoip from "geoip-lite";
import { deletekeys } from "../../common/services/index.js";
import { redisClient } from "../../DB/index.js";
const router = Router();
const loginlimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  limit: async function (req) {
    const geo = geoip.lookup(req.ip);
    const country = geo?.country || "Unknown";
    return country === "EG" ? 5 : 3;
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  requestPropertyName: "ratelimit",
  handler: (req, res, next) => {
    return res.status(429).json({
      message: "Too many requests",
    });
  },
  keyGenerator: (req, res, next) => {
    const ip = ipKeyGenerator(req.ip, 56);
    return `${ip}-${req.path}`;
  },
  store: {
    async incr(key, cb) {
      try {
        const count = await redisClient.incr(key);
        if (count === 1) await redisClient.expire(key, 120);
        cb(null, count);
      } catch (error) {
        cb(error);
      }
    },
    async decrement(key) {
      if (await redisClient.exists(key)) {
        await redisClient.decr(key);
      }
    },
  },
});
router.post(
  "/signup",
  validation(validators.signup),
  async (req, res, next) => {
    const account = await signup(req.body);
    console.log("Account created:", account);
    return SuccessResponse({ res, status: 201, data: { account } });
  },
);
router.patch(
  "/confirm-email",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    await confirmEmail(req.body);
    return SuccessResponse({ res });
  },
);
router.post(
  "/resend-confirm-email",
  validation(validators.resendconfirmEmail),
  async (req, res, next) => {
    await resendconfirmEmail(req.body);
    return SuccessResponse({ res });
  },
);
router.post(
  "/request-forgot-password",
  validation(validators.resendconfirmEmail),
  async (req, res, next) => {
    await requestForgotPassword(req.body);
    return SuccessResponse({ res });
  },
);
router.patch(
  "/verify-forgot-password",
  validation(validators.confirmEmail),
  async (req, res, next) => {
    await verifyForgotPasswordOtp(req.body);
    return SuccessResponse({ res });
  },
);
router.patch(
  "/reset-forgot-password",
  validation(validators.resetForgotPassword),
  async (req, res, next) => {
    await resetForgotPasswordOtp(req.body);
    return SuccessResponse({ res });
  },
);
router.post(
  "/login",
  validation(validators.login),
  loginlimiter,
  async (req, res, next) => {
    const credentials = await login(req.body, `${req.protocol}://${req.host}`);
    await deletekeys(`${req.ip}-${req.path}`);
    return SuccessResponse({ res, status: 200, data: { ...credentials } });
  },
);
router.post("/signup/gmail", async (req, res, next) => {
  const { status, credentials } = await signupWithGmail(
    req.body.idToken,
    `${req.protocol}://${req.host}`,
  );
  return SuccessResponse({ res, status, data: { ...credentials } });
});
export default router;
export const createNumberOtp = () => {
  return Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
};
