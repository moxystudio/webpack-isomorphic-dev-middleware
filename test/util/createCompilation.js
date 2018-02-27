'use strict';

const merge = require('lodash/merge');

module.exports = (overrides) => merge({
    clientStats: {
        toString() {
            return [
                'Asset    Size',
                'foo.js   10Kb',
            ].join('\n');
        },

        toJson() {
            return {
                assets: [
                    { name: 'foo.js' },
                ],
            };
        },

        startTime: 0,
        endTime: 0,
    },
    serverStats: {
        toString() {
            return [
                'Asset    Size',
                'bar.js   10Kb',
            ].join('\n');
        },

        toJson() {
            return {
                assets: [
                    { name: 'bar.js' },
                ],
            };
        },

        startTime: 0,
        endTime: 0,
    },
    duration: 0,
}, overrides);
