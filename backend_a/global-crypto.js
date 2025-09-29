// global-crypto.js - Fix for crypto module in Node.js 18
const crypto = require('crypto');

if (!global.crypto) {
  global.crypto = crypto;
}