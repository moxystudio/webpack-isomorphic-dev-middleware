'use strict';

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

// The output of this function must have the same methods as MemoryFileSystem
// See https://github.com/webpack/memory-fs/blob/master/lib/MemoryFileSystem.js
module.exports = Object.assign({}, fs, {
    mkdirp,
    join: path.join,
});
