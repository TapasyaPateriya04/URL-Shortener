const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortCode: { type: String, required: true, unique: true },
  accessTokenHash: { type: String, required: true, select: false },
  createdAt: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  clickCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Url', urlSchema);
