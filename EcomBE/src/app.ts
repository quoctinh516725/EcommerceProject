import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { env } from "./config/env";

import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import profileRoutes from "./routes/profile.routes";
import publicRoutes from "./routes/public.routes";
import sellerRoutes from "./routes/seller.routes";
import cartRoutes from "./routes/cart.routes";
import staffRoutes from "./routes/staff.routes";
import orderRoutes from "./routes/order.routes";
import subOrderRoutes from "./routes/subOrder.routes";
import paymentRoutes from "./routes/payment.routes";

import reviewRoutes from "./routes/review.route";
import chatRoutes from "./routes/chat.route";
import notificationRoutes from "./routes/notification.route";

const app = express();

// 1. Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (env.NODE_ENV === "production") {
        const allowed = process.env.FRONTEND_URL
          ? [process.env.FRONTEND_URL]
          : [];
        if (allowed.includes(origin)) return callback(null, true);
        return callback(null, false);
      }
      callback(null, true); // dev mode
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 2. Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later.",
});
app.use(
  ["/api/auth", "/api/admin", "/api/profile", "/api/seller", "/api/staff"],
  authLimiter
);

// 3. Health check
app.get("/health", (_req, res) =>
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  })
);

// 4. Routes
// Public (no auth)
app.use("/api", publicRoutes);

// Authenticated
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/sub-orders", subOrderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);

// 5. Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
