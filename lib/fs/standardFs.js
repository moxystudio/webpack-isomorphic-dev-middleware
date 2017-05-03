/* eslint global-require:0 */

'use strict';

let cachedStandardFs;

// The output of this function must have the same methods as MemoryFileSystem
// See https://github.com/webpack/memory-fs/blob/master/lib/MemoryFileSystem.js
function standardFs() {
    // Lazy load instantiation because it probably won't be used 99% of time
    if (!cachedStandardFs) {
        const fs = require('fs');
        const path = require('path');
        const mkdirp = require('mkdirp');

        cachedStandardFs = Object.assign({}, fs, {
            mkdirp,
            join: path.join,
        });
    }

    return cachedStandardFs;
}

module.exports = standardFs;
