const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('base64url');
console.log(secret);