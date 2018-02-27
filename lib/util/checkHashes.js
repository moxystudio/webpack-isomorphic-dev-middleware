'use strict';

const chalk = require('chalk');

const configProperties = [
    'output.filename',
    'output.chunkFilename',
    'output.hotUpdateMainFilename',
    'output.hotUpdateChunkFilename',
];

function verifyAssets(compilation, options) {
    const write = options.report ? options.report.write : (msg) => process.stderr.write(msg);
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
        const assetsWithHash = statsJson.assets.filter(({ name }) =>
            /(^|[^0-9a-z])(?=[a-z]*\d)(?=\d*[a-z])[0-9a-z]{10,}[^0-9a-z]/i.test(name));

        if (assetsWithHash.length) {
            detected.assets.push(...assetsWithHash);
            detected.types.push(type);
        }

        return detected;
    }, { assets: [], types: [] });

    if (!assets.length) {
        return false;
    }

    // At this point, assets with hashes were encountered
    // Print a good warning, using `options.report.write` if available

    let str;

    str = `${chalk.yellow('WARN')}: Assets with an hash in its name were detected on the `;
    str += `${types.map((type) => chalk.bold(type)).join(' and ')}:\n`;

    assets.forEach((asset) => {
        str += `- ${asset.name}\n`;
    });

    str += `
This is known to cause ${chalk.bold('memory leaks')} with ${chalk.bold('webpack-dev-middleware\'s')} in-memory filesystem.
You should avoid using ${chalk.bold('[hash]')} in ${configProperties.join(', ')} as well as similar options in loaders & plugins.
Alternatively, you may set \`memoryFs\` to false altough it will still create many files in the output folder.
If you feel this was a false positive, please ignore this warning.

`;

    write(str);

    return true;
}

function checkHashes(compiler, options) {
    // Check if files with hashes are being emitted
    // This is known to have memory leaks because files stay in memory forever
    // See https://github.com/webpack/webpack/issues/2662#issuecomment-252499743
    compiler.once('end', (compilation) => {
        // If the first verification was ok, do another one on the second compilation (rebuild)
        // This is necessary to verify if `hot-update` files are not hashed
        if (!verifyAssets(compilation, options)) {
            compiler.once('end', (compilation) => verifyAssets(compilation, options));
        }
    });
}

module.exports = checkHashes;
