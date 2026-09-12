import rateLimit from "express-rate-limit";

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests per IP per window
  standardHeaders: true, // adds RateLimit-* headers
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again later." },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});