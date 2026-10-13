const { start } = require('./index');

start().catch((err) => {
  console.error('Unable to start URL Shortener API:', err);
  process.exitCode = 1;
});
