const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
console.log('Starting backend by requiring dist/index.js with backend .env');
require(path.join(__dirname, '..', 'dist', 'index.js'));
// keep process alive
setInterval(() => {}, 1 << 30);
