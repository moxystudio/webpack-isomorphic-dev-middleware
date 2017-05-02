'use strict';

const fs = require('fs');
const pTry = require('p-try');
const express = require('express');
const request = require('supertest');
const webpackIsomorphicDevMiddleware = require('../');
const createCompiler = require('./util/createCompiler');
const createOutputStream = require('./util/createOutputStream');
const configClientBasic = require('./configs/client-basic');
const configServerBasic = require('./configs/server-basic');
const configServerWithHashes = require('./configs/server-with-hashes');

describe('output', () => {
    const originalStderr = process.stderr;

    afterEach(() => { process.stderr = originalStderr; });
    afterEach(() => createCompiler.teardown());

    it('should report stats only once by default', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerBasic);
        const outputStream = createOutputStream();

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: { report: { output: outputStream } },
        }));

        return pTry(() => (
            request(app)
            .get('/client.js')
            .expect(200)
        ))
        .then(() => new Promise((resolve) => {
            fs.writeFileSync(configClientBasic.entry, fs.readFileSync(configClientBasic.entry));
            compiler.once('begin', resolve);
        }))
        .then(() => (
            request(app)
            .get('/client.js')
            .expect(200)
        ))
        .then(() => {
            expect(outputStream.getReportOutput()).toMatchSnapshot();
        });
    });

    it('should not report anything if watchOptions.report is falsy', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerWithHashes);
        const outputStream = createOutputStream();

        process.stderr = outputStream;

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            watchOptions: { report: null },
        }));

        return request(app)
        .get('/client.js')
        .expect(200)
        .then(() => {
            expect(outputStream.getReportOutput()).toMatchSnapshot();
        });
    });

    describe('human errors', () => {
        it('should warn if hashes are being used in webpack config', () => {
            const app = express();
            const compiler = createCompiler(configClientBasic, configServerWithHashes);
            const outputStream = createOutputStream();

            app.use(webpackIsomorphicDevMiddleware(compiler, {
                watchOptions: { report: { output: outputStream } },
            }));

            return request(app)
            .get('/client.js')
            .expect(200)
            .then(() => {
                expect(outputStream.getReportOutput()).toMatchSnapshot();
            });
        });

        it('should not warn about hashes are being used in webpack config if options.memoryFs = false', () => {
            const app = express();
            const compiler = createCompiler(configClientBasic, configServerWithHashes);
            const outputStream = createOutputStream();

            app.use(webpackIsomorphicDevMiddleware(compiler, {
                memoryFs: false,
                watchOptions: { report: { output: outputStream } },
            }));

            return request(app)
            .get('/client.js')
            .expect(200)
            .then(() => {
                expect(outputStream.getReportOutput()).toMatchSnapshot();
            });
        });

        it('should not check human errors if options.watchOptions.report is falsy', () => {
            const app = express();
            const compiler = createCompiler(configClientBasic, configServerWithHashes);
            const outputStream = createOutputStream();

            process.stderr = outputStream;

            app.use(webpackIsomorphicDevMiddleware(compiler, {
                memoryFs: false,
                watchOptions: { report: null },
            }));

            return request(app)
            .get('/client.js')
            .expect(200)
            .then(() => {
                expect(outputStream.getReportOutput()).toMatchSnapshot();
            });
        });
    });
});
