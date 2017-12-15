'use strict';

const fs = require('fs');

function touchFile(path) {
    fs.writeFileSync(path, fs.readFileSync(path));
}

module.exports = touchFile;
