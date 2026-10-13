const crypto = require('crypto');

function createAccessToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashAccessToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function tokensMatch(token, tokenHash) {
  if (typeof token !== 'string' || typeof tokenHash !== 'string') return false;

  const suppliedHash = Buffer.from(hashAccessToken(token), 'hex');
  const storedHash = Buffer.from(tokenHash, 'hex');
  return suppliedHash.length === storedHash.length
    && crypto.timingSafeEqual(suppliedHash, storedHash);
}

module.exports = { createAccessToken, hashAccessToken, tokensMatch };
