const test = require('node:test');
const assert = require('node:assert/strict');
const { validateShortenRequest } = require('../utils/validation');
const { createAccessToken, hashAccessToken, tokensMatch } = require('../utils/accessToken');
const Url = require('../models/Url');
const { app } = require('../index');

test('accepts an HTTP URL and a valid custom alias', () => {
  const result = validateShortenRequest({
    url: 'https://example.com/path',
    customCode: 'spring_sale-1',
  });

  assert.equal(result.error, undefined);
  assert.equal(result.value.originalUrl, 'https://example.com/path');
  assert.equal(result.value.customCode, 'spring_sale-1');
});

test('rejects unsupported protocols, malformed URLs, credentials, and invalid aliases', () => {
  assert.match(validateShortenRequest({ url: 'javascript:alert(1)' }).error, /HTTP and HTTPS/);
  assert.match(validateShortenRequest({ url: 'not a url' }).error, /valid URL/);
  assert.match(validateShortenRequest({ url: 'https://user:pass@example.com' }).error, /credentials/);
  assert.match(validateShortenRequest({ url: 'https://example.com', customCode: 'x' }).error, /Aliases/);
  assert.match(validateShortenRequest({ url: 'https://example.com', customCode: 'API' }).error, /reserved/);
});

test('rejects an expiry time that is not in the future', () => {
  const result = validateShortenRequest({
    url: 'https://example.com',
    expiryDate: '2000-01-01T00:00:00.000Z',
  });

  assert.match(result.error, /future/);
});

test('management tokens match only their own secret', () => {
  const token = createAccessToken();
  const tokenHash = hashAccessToken(token);

  assert.equal(tokensMatch(token, tokenHash), true);
  assert.equal(tokensMatch('another-token', tokenHash), false);
  assert.equal(tokensMatch(null, tokenHash), false);
});

test('a root short-link route increments clicks and redirects to its destination', async (context) => {
  const originalFindOneAndUpdate = Url.findOneAndUpdate;
  Url.findOneAndUpdate = async (filter, update) => {
    assert.equal(filter.shortCode, 'sample-code');
    assert.equal(update.$inc.clickCount, 1);
    return { originalUrl: 'https://example.com/landing' };
  };

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  context.after(async () => {
    Url.findOneAndUpdate = originalFindOneAndUpdate;
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  const response = await fetch(`http://127.0.0.1:${server.address().port}/sample-code`, {
    redirect: 'manual',
  });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://example.com/landing');
});
