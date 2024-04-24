const express = require('express');
const ApiRateLimiter = require('../middleware/attempts.middleware');
const { sanitizeUrlInput, rejectDomainlessIpUrls, rejectHtmlUrls, rejectJavaScriptUrls, validateUrl } = require('../middleware/verification.middleware');

const { shortenUrl, shortenCustomUrl, deleteUrlMap } = require('../controllers/mapper.controller');

const router = express.Router();
// create a new url map
//router.post('/create-url-map', createUrlMap);

// shorten longUrl to shortUrl
router.post('/shorten', 
    ApiRateLimiter, 
    validateUrl,
    rejectDomainlessIpUrls,
    rejectJavaScriptUrls,
    rejectHtmlUrls,
    sanitizeUrlInput, 
    shortenUrl
)

// shorten longUrl to customUrl
router.post('/shorten-custom', 
    ApiRateLimiter, 
    validateUrl,
    rejectDomainlessIpUrls,
    rejectJavaScriptUrls,
    rejectHtmlUrls,
    sanitizeUrlInput,
    shortenCustomUrl
)

// shorten longUrl to customUrl
router.delete('/delete/:id', ApiRateLimiter, deleteUrlMap)

module.exports = router;