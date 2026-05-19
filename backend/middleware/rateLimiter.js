const rateLimitPkg = require('express-rate-limit');
const rateLimit = rateLimitPkg.rateLimit || rateLimitPkg;
const ipKeyGenerator = rateLimitPkg.ipKeyGenerator || ((req) => req.ip);

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  keyGenerator: (req, res) => {
    if (req.user && req.user.id) return String(req.user.id);
    return ipKeyGenerator(req, res);
  },
  message: { error: 'Too many AI requests. Limit is 20 per hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter };
