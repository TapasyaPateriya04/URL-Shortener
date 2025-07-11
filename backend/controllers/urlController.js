const Url = require('../models/Url');
const generateCode = require('../utils/generateCode');

const BASE_URL = process.env.BASE_URL;

exports.shortenUrl = async (req, res) => {
  const { url, expiryDate } = req.body;

  try {
    // Native URL constructor for validation
    new URL(url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const shortCode = generateCode();
  const shortUrl = `${BASE_URL}/${shortCode}`;

  try {
    await Url.create({ originalUrl: url, shortCode, expiryDate });
    return res.status(201).json({
       shortUrl,
       });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

exports.redirectUrl = async (req, res) => {
  const { code } = req.params;

  try {
    const urlEntry = await Url.findOne({ shortCode: code });

    if (!urlEntry) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    if (urlEntry.expiryDate && urlEntry.expiryDate < new Date()) {
      return res.status(410).json({ error: 'URL has expired' });
    }

    urlEntry.clickCount++;
    await urlEntry.save();

    return res.redirect(urlEntry.originalUrl);
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
};
