const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../blocklist')
let maliciousDomainsWithCarriageReturn = fs.readFileSync(filePath + '/malicious_domains.txt', 'utf8').split('\n');
const maliciousDomains = maliciousDomainsWithCarriageReturn.map(domain => domain.replace(/\r$/, ''));

module.exports = {
    maliciousDomains
}