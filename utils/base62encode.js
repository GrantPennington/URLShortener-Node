const crypto = require('crypto');

const encodeBase62 = (url) => {
    let numericValue = stringToNumericValue(url);
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const base = characters.length;
    let result = '';

    do {
        result = characters[Number(numericValue % BigInt(base))] + result;
        numericValue = numericValue / BigInt(base);
    } while (numericValue > 0n);

    return result;
}

const stringToNumericValue = (str) => {
    // Generate SHA-256 hash
    const hash = crypto.createHash('sha256');
    hash.update(str);
    const hashHex = hash.digest('hex');
  
    // Convert hash to a decimal number
    const numericValue = BigInt('0x' + hashHex);
  
    return numericValue;
}

module.exports = { encodeBase62 };