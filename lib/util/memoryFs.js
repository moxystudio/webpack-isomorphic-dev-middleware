'use strict';

const MemoryFileSystem = require('memory-fs');

function memoryFs() {
    return new MemoryFileSystem();
}

module.exports = memoryFs;
