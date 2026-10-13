const express = require('express');
const router = express.Router();
const {
  shortenUrl,
  getUrlDetails,
  deleteUrl,
} = require('../controllers/urlController');

router.post('/shorten', shortenUrl);
router.get('/urls/:code', getUrlDetails);
router.delete('/urls/:code', deleteUrl);

module.exports = router;
