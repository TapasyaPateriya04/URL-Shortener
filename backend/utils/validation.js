const ALIAS_PATTERN = /^[a-zA-Z0-9_-]{3,30}$/;

function validateShortenRequest(body) {
  if (!body || typeof body.url !== 'string' || !body.url.trim()) {
    return { error: 'Enter a URL to shorten.' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(body.url.trim());
  } catch {
    return { error: 'Enter a valid URL, including https:// or http://.' };
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname) {
    return { error: 'Only HTTP and HTTPS links can be shortened.' };
  }

  if (parsedUrl.username || parsedUrl.password) {
    return { error: 'URLs containing sign-in credentials are not supported.' };
  }

  let expiryDate;
  if (body.expiryDate) {
    expiryDate = new Date(body.expiryDate);
    if (Number.isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
      return { error: 'Choose an expiry time in the future.' };
    }
  }

  let customCode;
  if (body.customCode) {
    customCode = String(body.customCode).trim();
    if (!ALIAS_PATTERN.test(customCode)) {
      return { error: 'Aliases must be 3–30 letters, numbers, hyphens, or underscores.' };
    }
    if (customCode.toLowerCase() === 'api') {
      return { error: 'The alias "api" is reserved. Choose a different ending.' };
    }
  }

  return {
    value: {
      originalUrl: parsedUrl.toString(),
      expiryDate,
      customCode,
    },
  };
}

module.exports = { validateShortenRequest };
