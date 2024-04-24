const URLMap = require('../models/urlMap');
const { encodeBase62 } = require('../utils/base62encode');
const { isRedirectUrl, isMalicious } = require('../middleware/verification.middleware');

const createUrlMap = async (req, res) => {
    try {
        const { shortUrl, longUrl } = req.body;
        const newMap = URLMap.create({ shortUrl, longUrl });
        if(!newMap) {
            return res.status(400).json({
                message: 'Something went wrong'
            });
        }
        res.status(201).json({ shortUrl, longUrl });
    } catch(error) {
        console.error(error);
        res.status(500).json({
            message: 'Something went wrong'
        });
    }
};

const shortenUrl = async (req, res) => {
    const { longUrl } = req.body;
    try {
        // check url in malicious domains
        if(isMalicious(longUrl)) {
            return res.status(400).json({
                message: 'URL is not allowed. It may contain malicious domains or characters.'
            });
        }
        // check if longUrl is a redirect url
        isRedirectUrl(longUrl, (isRedirect, redirectUrl) => {
            if(isRedirect) {
                return res.status(400).json({
                    message: 'URL is not allowed.'
                });
            }
        });
        // check if longUrl exists in db
        const urlMapping = await URLMap.findOne({ longUrl });

        if(urlMapping) {
            return res.status(400).json({ message: 'URL already exists' });
        }
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 24);
        const shortCode = encodeBase62(longUrl);
        const newUrlMap = new URLMap({ shortUrl: shortCode, longUrl, expiration });
        await newUrlMap.save();
        // construct the shortened URL
        const shortUrl = `http://localhost:3001/${newUrlMap.shortUrl}`;
        const html = `
            <h2>Shortened URL: <a href="http://localhost:3001/${newUrlMap.shortUrl}">${newUrlMap.shortUrl}</a></h2>
            <a href="/">Back to Url Maps</a>
        `
        // set headers to send as html
        //res.set('Content-Type', 'text/html')
        //res.status(200).send(Buffer.from(html));
        res.status(200).json({ message: 'Success', shortUrl, longUrl });
    } catch(err) {
        console.error('Error shortening URL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const shortenCustomUrl = async (req, res) => {
    const { longUrl, customUrl } = req.body;
    try {
        // check url in malicious domains
        if(isMalicious(longUrl)) {
            return res.status(400).json({
                message: 'URL is not allowed. It may contain malicious domains or characters.'
            });
        }
        // check if longUrl is a redirect url
        isRedirectUrl(longUrl, (isRedirect, redirectUrl) => {
            if(isRedirect) {
                return res.status(400).json({
                    message: 'URL is not allowed.'
                });
            }
        });
        // check if longUrl exists in db
        let urlMapping = await URLMap.findOne({ longUrl });

        if(!urlMapping) {
            const expiration = new Date();
            expiration.setHours(expiration.getHours() + 24); // 24 hours
            //expiration.setTime(expiration.getTime() + (2 * 60 * 1000)); // 2 minutes for testing
            const newUrlMap = new URLMap({ shortUrl: customUrl, longUrl, expiration });
            await newUrlMap.save();
        }

        // construct the shortened URL
        const shortUrl = `http://localhost:3001/${customUrl}`;
        const html = `
            <h2>Shortened URL: <a href="http://localhost:3001/${shortUrl}">${shortUrl}</a></h2>
            <a href="/">Back to Url Maps</a>
        `
        // set headers to send as html
        //res.set('Content-Type', 'text/html')
        //res.status(200).send(Buffer.from(html));
        res.status(200).json({ message: 'Success', shortUrl, longUrl });
    } catch(err) {
        console.error('Error shortening URL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const redirectUrl = async (req, res) => {
    const { shortCode } = req.params;
    try {
        const urlMapping = await URLMap.findOne({ shortUrl: shortCode });
        if(!urlMapping) {
            return res.status(404).json({
                message: 'URL not found'
            });
        }
        res.redirect(urlMapping.longUrl);
    } catch(err) {
        console.error('Error redirecting URL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteUrlMap = async (req, res) => {
    try {
        const urlMap = await URLMap.findByIdAndDelete(req.params.id);
        if(!urlMap) {
            return res.status(404).json({ message: 'Error occurred while deleting URL' });
        }
        res.status(200).json({ message: 'URL Successfully Deleted' });
        // res.set('Content-Type', 'text/html')
        // // After successful deletion, render an HTML template
        // res.send(`
        // <!DOCTYPE html>
        // <html lang="en">
        // <head>
        //     <meta charset="UTF-8">
        //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
        //     <title>Success</title>
        // </head>
        // <body>
        //     <h1>Deletion Successful!</h1>
        //     <p>Your item has been successfully deleted.</p>
        //     <a href="/">Back</a>
        // </body>
        // </html>
        // `);
        //res.status(200).send(Buffer.from(`<h2>URL Map Deleted</h2><a href="/">Back</a>`))
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { createUrlMap, shortenUrl, shortenCustomUrl, redirectUrl, deleteUrlMap };