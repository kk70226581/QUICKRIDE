const requestCounts = new Map();

const getClientKey = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "unknown";

const cleanupStaleEntries = () => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (entry.resetAt <= now) {
      requestCounts.delete(key);
    }
  }
};

setInterval(cleanupStaleEntries, 5 * 60 * 1000);

const createRateLimiter = ({ windowMs, max, message }) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${getClientKey(req)}:${req.baseUrl || ""}:${req.path}`;
    const entry = requestCounts.get(key);

    if (!entry || entry.resetAt <= now) {
      requestCounts.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      return next();
    }

    entry.count += 1;
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - entry.count));

    if (entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        message: message || "Too many requests. Please try again shortly.",
      });
    }

    return next();
  };
};

const applySecurityHeaders = (req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), payment=(self), geolocation=(self)");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' wss: ws: https://*.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self' 'unsafe-inline';"
  );
  next();
};

const hasUnsafeKey = (value) => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.entries(value).some(([key, nestedValue]) => {
    if (key.startsWith("$") || key.includes(".")) {
      return true;
    }

    return hasUnsafeKey(nestedValue);
  });
};

const blockUnsafePayloads = (req, res, next) => {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    return res.status(400).json({ message: "Invalid request payload" });
  }

  return next();
};

module.exports = {
  applySecurityHeaders,
  blockUnsafePayloads,
  createRateLimiter,
};
