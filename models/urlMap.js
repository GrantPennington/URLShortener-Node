const mongoose = require('mongoose');

const urlMappingSchema = new mongoose.Schema({
    shortUrl: {
        type: String,
        required: true,
        unique: true
    },
    longUrl: {
        type: String,
        required: true
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
});

const URLMap = mongoose.model('UrlMapping', urlMappingSchema);

module.exports = URLMap;