const crypto = require('crypto');

module.exports = () => crypto.randomBytes(3).toString('hex'); // e.g., abc123
