// import modules
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const ncp = require('node-clipboardy');
const cron = require('node-cron');
const https = require('https');

/* Security Libraries */
const expressDefend = require('express-defend');
const blacklist = require('express-blacklist');
const helmet = require('helmet');

require('dotenv').config(); // environment variables

const UrlMap = require('./models/urlMap');
const ApiRateLimiter = require('./middleware/attempts.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

const mapperRoutes = require('./routes/mapper.router');

// db connection string
const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
    dbName: 'url_mapper',
})
mongoose.connection.once('open', () => {
    console.log("Connected to MongoDB");
}).on('error', (err) => {
    console.error(err);
});

// middleware to set security headers
app.use(helmet());
// defense against malicious requests and xss attacks
app.use(blacklist.blockRequests('blacklist.txt'));
app.use(expressDefend.protect({ 
    maxAttempts: 5, 
    dropSuspiciousRequest: true, 
    logFile: 'suspicious.log',
    onMaxAttemptsReached: function(ipAddress, url){
        blacklist.addAddress(ipAddress);
    } 
}));

/* USE THIS LATER WHEN SWITCHING OVER TO HTTPS not LOCALHOST */
// middleware to redirect HTTP to HTTPS
// app.use((req,res,next) => {
//     if(!req.secure) {
//         return res.redirect('https://' + req.headers.host + req.url);
//     }
//     next();
// });

// middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/v1/url-shortener', mapperRoutes)

const { redirectUrl } = require('./controllers/mapper.controller');

// get all url maps
app.get('/', ApiRateLimiter, async (req, res) => {
    try {
        const maps = await UrlMap.find({});
        if(!maps) {
            return res.status(404).json({ message: 'No URL Maps found' });
        }
        // send html with all url maps
        const urlLinks = maps.map((map) => {
            return `
            <div style="padding-left: 12px; border: 1px solid black">
                <h4>Original URL: ${map.longUrl}</h4>\n
                <h4>Short URL: <a href="http://localhost:3001/${map.shortUrl}">http://localhost:3001/${map.shortUrl}</a></h4>\n
                <button style="margin-left: 20px;" onclick="
                    fetch('http://localhost:3001/copy-to-clipboard/${map.shortUrl}', { 
                        method: 'GET',
                    })
                    .then((resp) => {
                        return resp.text();
                    }).then((text) => {
                        alert(text);
                    }).catch(error => {
                        console.error(error);
                    })
                ">Copy to Clipboard</button>
                <button style="margin-bottom: 6px;" onclick="
                    fetch('http://localhost:3001/api/v1/url-shortener/delete/${map._id}', { method: 'DELETE' })
                    .then((resp) => {
                        return resp.text();
                    }).then((html) => {
                        document.body.innerHTML = html;
                    }).catch(error => {
                        console.error(error);
                    })
                ">Delete URL Mapping</button>\n
            </div>
            `
        })
        // add element to front of array
        urlLinks.unshift(`<div style="margin: 10px; margin-top: 4px;"><a href="/create">Create New Shortened URL</a></div>\n`);
        urlLinks.unshift(`<h1>URL Shortener</h1>\n`);
        // set headers to send as html
        res.set('Content-Type', 'text/html')
        res.status(200).send(Buffer.from(urlLinks.join('')));
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.get('/create', ApiRateLimiter, (req, res) => {
    const html = `
    <a href="/">Back to Urls</a>
    <h2>Create Shortened URL </h2>
    <form action="/api/v1/url-shortener/shorten-custom" method="POST">
        <input type="text" name="longUrl" placeholder="Enter long URL" />
        <input type="text" name="customUrl" placeholder="Enter custom URL" />
        <button type="submit">Create</button>
    </form>
    `
    // set headers to send as html
    res.set('Content-Type', 'text/html')
    res.status(200).send(Buffer.from(html));
});

app.get('/copy-to-clipboard/:url', ApiRateLimiter, async (req, res) => {
    try {
        const url = req.params.url;
        ncp.write(`http://localhost:3001/${url}`);
        res.send(`Copied to clipboard!`);
    } catch(err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// redirect to longUrl
app.get('/:shortCode', ApiRateLimiter, redirectUrl)

// schedule database cleanup (every 24 hours)
cron.schedule('0 0 * * *', async () => {
    await UrlMap.deleteMany({ expiration: { $lt: new Date() } });
    console.log('Database cleanup complete');
});

// start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
