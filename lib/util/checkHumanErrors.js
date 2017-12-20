'use strict';

const chalk = require('chalk');

function checkHashes(compilation, options) {
    const { types, assets } = ['client', 'server'].reduce((detected, type) => {
        const statsJson = compilation[`${type}Stats`].toJson({
            assets: true,
            chunks: false,
            version: false,
            children: false,
            modules: false,
            colors: true,
            timings: false,
            hash: false,
        });

        // Try to detect hashes the best we can, see http://regexr.com/3frlr
        // We can't check webpackConfig.output.filename and other fields because there are loaders &
        // plugins that also emit assets; this is the most reliable way
        const assetWithHash = statsJson.assets.find(({ name }) =>
            /(^|[^0-9a-z])(?=[a-z]*\d)(?=\d*[a-z])[0-9a-z]{10,}[^0-9a-z]/i.test(name));

        if (assetWithHash) {
            detected.assets.push(assetWithHash.name);
            detected.types.push(type);
        }

        return detected;
    }, { assets: [], types: [] });

    if (assets.length) {
        let str;

        str = `${chalk.yellow('WARN')}: Assets with an hash in its name was detected on the `;
        str += `${types.map((type) => chalk.bold(type)).join(' and ')}:\n`;
        str += `- ${assets[0]}\n`;
        /* istanbul ignore next */
        str += assets[1] ? `- ${assets[1]}\n` : '';
        /* istanbul ignore next */
        str += assets[2] ? `- ${assets[2]}\n` : '';
        /* istanbul ignore next */
        str += assets[3] ? '- ...\n' : '';

        str += `
This is known to cause ${chalk.bold('memory leaks')} with ${chalk.bold('webpack-dev-middleware\'s')} in-memory filesystem.
Either ${chalk.bold('avoid having hashes')} in development or disable in-memory filesystem through the \`memoryFs\` option.
If you feel this was a false positive, please ignore this warning.

`;

        options.report.write(str);
    }
}

// -----------------------------------------------------------

function checkHumanErrors(compilation, options) {
    // Check if files with hashes are being emitted.. this is known to have memory leaks because files stay in memory forever
    // See https://github.com/webpack/webpack/issues/2662#issuecomment-252499743
    options.memoryFs && checkHashes(compilation, options);
}

module.exports = checkHumanErrors;
