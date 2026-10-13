const crypto = require('crypto');

module.exports = () => crypto.randomBytes(6).toString('base64url');
