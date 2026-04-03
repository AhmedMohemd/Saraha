import { NODE_ENV, ORIGINS, port } from "../config/config.service.js";
import { globalErrorHandling } from "./common/utils/index.js";
import { connectDB, connectRedis, redisClient } from "./DB/index.js";
import { authRouter, messageRouter, userRouter } from "./modules/index.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { resolve } from "node:path";
// import axios from "axios";
// import geoip from "geoip-lite";
import morgan from "morgan";
async function bootstrap() {
  const app = express();
  const limiter = rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true,
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

  app.set("trust proxy", true);
  app.use(morgan("dev"));
  app.use(cors(), helmet(), limiter, express.json());
  await connectDB();
  await connectRedis();
  app.use("/uploads", express.static(resolve("../uploads")));
  app.get("/", (req, res) => res.send("Hello World!"));
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/message", messageRouter);
  app.use("{/*dum}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });
  app.use((error, req, res, next) => {
    const status = error.cause?.status ?? 500;
    return res.status(status).json({
      error_message:
        status == 500
          ? "something went wrong"
          : (error.message ?? "something went wrong"),
      stack: NODE_ENV == "development" ? error.stack : undefined,
    });
  });
  app.use(globalErrorHandling);
  app.listen(port, () =>
    console.log(`Server is running on http://localhost:${port}`),
  );
}
export default bootstrap;
