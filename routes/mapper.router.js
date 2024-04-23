const express = require('express');

const { shortenUrl, shortenCustomUrl, deleteUrlMap } = require('../controllers/mapper.controller');

const router = express.Router();
// create a new url map
//router.post('/create-url-map', createUrlMap);
// shorten longUrl to shortUrl
router.post('/shorten', shortenUrl)
// shorten longUrl to customUrl
router.post('/shorten-custom', shortenCustomUrl)
// shorten longUrl to customUrl
router.delete('/delete/:id', deleteUrlMap)

module.exports = router;