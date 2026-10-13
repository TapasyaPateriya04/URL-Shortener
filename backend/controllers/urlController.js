const Url = require('../models/Url');
const generateCode = require('../utils/generateCode');
const { createAccessToken, hashAccessToken, tokensMatch } = require('../utils/accessToken');
const { validateShortenRequest } = require('../utils/validation');

function getShortUrl(shortCode) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl.replace(/\/+$/, '')}/${shortCode}`;
}

function getBearerToken(req) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]+)$/);
  return match ? match[1] : null;
}

async function findOwnedUrl(req, res) {
  const { code } = req.params;
  const accessToken = getBearerToken(req);
  if (!accessToken) {
    res.status(401).json({ error: 'This link is not available in this browser.' });
    return null;
  }

  const urlEntry = await Url.findOne({ shortCode: code }).select('+accessTokenHash');
  if (!urlEntry || !tokensMatch(accessToken, urlEntry.accessTokenHash)) {
    res.status(404).json({ error: 'Saved link not found.' });
    return null;
  }

  return urlEntry;
}

function toPublicLink(urlEntry) {
  return {
    shortCode: urlEntry.shortCode,
    shortUrl: getShortUrl(urlEntry.shortCode),
    originalUrl: urlEntry.originalUrl,
    createdAt: urlEntry.createdAt,
    expiryDate: urlEntry.expiryDate || null,
    clickCount: urlEntry.clickCount,
  };
}

exports.shortenUrl = async (req, res) => {
  const { value, error } = validateShortenRequest(req.body);
  if (error) return res.status(400).json({ error });

  const accessToken = createAccessToken();
  const accessTokenHash = hashAccessToken(accessToken);
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shortCode = value.customCode || generateCode();
    try {
      const urlEntry = await Url.create({
        originalUrl: value.originalUrl,
        shortCode,
        expiryDate: value.expiryDate,
        accessTokenHash,
      });

      return res.status(201).json({
        ...toPublicLink(urlEntry),
        shortUrl: getShortUrl(shortCode),
        accessToken,
      });
    } catch (err) {
      if (err.code === 11000) {
        if (value.customCode) {
          return res.status(409).json({ error: 'That alias is already taken. Try another one.' });
        }
        continue;
      }

      console.error('Unable to create short link:', err);
      return res.status(500).json({ error: 'The link could not be created. Please try again.' });
    }
  }

  return res.status(503).json({ error: 'A unique link could not be created. Please try again.' });
};

exports.getUrlDetails = async (req, res) => {
  try {
    const urlEntry = await findOwnedUrl(req, res);
    if (!urlEntry) return;
    return res.json(toPublicLink(urlEntry));
  } catch (err) {
    console.error('Unable to load short-link details:', err);
    return res.status(500).json({ error: 'Link details could not be loaded.' });
  }
};

exports.deleteUrl = async (req, res) => {
  try {
    const urlEntry = await findOwnedUrl(req, res);
    if (!urlEntry) return;
    await urlEntry.deleteOne();
    return res.status(204).end();
  } catch (err) {
    console.error('Unable to delete short link:', err);
    return res.status(500).json({ error: 'The link could not be deleted.' });
  }
};

exports.redirectUrl = async (req, res) => {
  const { code } = req.params;

  try {
    const urlEntry = await Url.findOneAndUpdate(
      {
        shortCode: code,
        $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
      },
      { $inc: { clickCount: 1 } },
      { new: true },
    );

    if (!urlEntry) {
      const existingUrl = await Url.findOne({ shortCode: code }).select('expiryDate');
      if (!existingUrl) return res.status(404).json({ error: 'Short URL not found.' });
      return res.status(410).json({ error: 'This short URL has expired.' });
    }

    return res.redirect(302, urlEntry.originalUrl);
  } catch (err) {
    console.error('Unable to redirect short link:', err);
    return res.status(500).json({ error: 'The short URL could not be opened.' });
  }
};
