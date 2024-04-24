const http = require('http');
const https = require('https');
const sanitizeHtml = require('sanitize-html');
const { URL } = require('url');
const validUrl = require('valid-url');

// list of malicious domains
const { maliciousDomains } = require('../utils/maliciousUrlArray');

const isRedirectUrl = (url, callback) => {
    // choose appropriate module based on URL scheme (http or https)
    const client = url.startsWith('https') ? https : http;

    // send a HEAD request to the URL
    const request = client.request(url, { method: 'HEAD' }, (response) => {
        // check if response is a redirect (status code 3xx)
        if(response.statusCode >= 300 && response.statusCode < 400){
            // extract the location header
            const redirectUrl = response.headers.location;
            if(redirectUrl && redirectUrl !== url) {
                // the URL is a redirect url, potentially malicious
                callback(true, redirectUrl);
            } else {
                // the URL is not a valid redirect url
                callback(false);
            }
        } else {
            // the url is not a redirect url
            callback(false);
        }
    });

    request.on('error', (error) => {
        console.error("Error while checking URL: ",error);
        callback(false);
    });

    // end the request
    request.end();
}

const validateUrl = (req, res, next) => {
    const urlToCheck = req.body.longUrl;
    const isValid = validUrl.isUri(urlToCheck);
    if(!isValid) {
        return res.status(400).json({ error: 'Invalid URL' });
    }
    next();
};

const sanitizeUrlInput = (req, res, next) => {
    if(req.body.longUrl) {
        req.body.longUrl = sanitizeHtml(req.body.longUrl, {
            allowedTags: [],
            allowedAttributes: {}
        });
    }
    next();
}

const rejectJavaScriptUrls = (req, res, next) => {
    const urlToCheck = req.body.longUrl;

    // check if the url contains JavaScript code
    const javascriptPattern = /^(?:javascript|data):/i;
    if(urlToCheck && javascriptPattern.test(urlToCheck)) {
        return res.status(400).json({ error: 'URLs containing JavaScript are not allowed' });
    }
    next();
};

const rejectHtmlUrls = (req, res, next) => {
    const urlToCheck = req.body.longUrl;

    // check if the url contains HTML code
    //const pattern = /<[^>]+>g/
    const pattern = /<(\S?)[^>]>.?|<.*?>/
    if(urlToCheck && pattern.test(urlToCheck)) {
        return res.status(400).json({ error: 'URLs containing HTML are not allowed' });
    }
    next();
};

const rejectDomainlessIpUrls = (req, res, next) => {
    const urlToCheck = req.body.longUrl;

    // Parse the URL using the url module
    const parsedUrl = new URL(urlToCheck);
    
    // check if the hostname is an IP address without a domain name
    //const pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\.d{1,3}$/
    const pattern = /^((25[0-5]|(2[0-4]|1[0-9]|[1-9]|)[0-9])(\.(?!$)|$)){4}$/
    if(parsedUrl.hostname && pattern.test(parsedUrl.hostname)) {
        return res.status(400).json({ error: 'Domainless IP address URLs are not allowed' });
    }

    // proceed to next middleware or controller
    next();
};

const isMalicious = (url) => {
    const domain = new URL(url).hostname;
    return maliciousDomains.includes(domain);
}

const rejectVariousHostnames = (req, res, next) => {
    // reject longUrl with http not https
    // hostnames to reject -> localhost
};

module.exports = { isRedirectUrl, sanitizeUrlInput, rejectDomainlessIpUrls, rejectJavaScriptUrls, rejectHtmlUrls, validateUrl, isMalicious };