'use strict';

const express = require('express');
const request = require('supertest');
const webpack = require('webpack');
const webpackIsomorphicDevMiddleware = require('../');
const createCompiler = require('./util/createCompiler');
const configClientBasic = require('./configs/client-basic');
const configServerBasic = require('./configs/server-basic');

describe('instantiation', () => {
    afterEach(() => createCompiler.teardown());

    it('should support a webpack multi-compiler', () => {
        const app = express();
        const multiCompiler = webpack([configClientBasic, configServerBasic]);
        const middleware = webpackIsomorphicDevMiddleware(multiCompiler, {
            report: false,
        });

        createCompiler.push(middleware.isomorphicCompiler);
        app.use(middleware);

        return request(app)
        .get('/client.js')
        .expect(200)
        .expect(/Hello!/);
    });

    it('should support two separate webpack compilers', () => {
        const app = express();
        const clientCompiler = webpack(configClientBasic);
        const serverCompiler = webpack(configServerBasic);
        const middleware = webpackIsomorphicDevMiddleware(clientCompiler, serverCompiler, {
            report: false,
        });

        createCompiler.push(middleware.isomorphicCompiler);
        app.use(middleware);

        return request(app)
        .get('/client.js')
        .expect(200)
        .expect(/Hello!/);
    });

    it('should support an isomorphic compiler', () => {
        const app = express();
        const compiler = createCompiler(configClientBasic, configServerBasic);

        app.use(webpackIsomorphicDevMiddleware(compiler, {
            report: false,
        }));

        return request(app)
        .get('/client.js')
        .expect(200)
        .expect(/Hello!/);
    });

    it('should give access to the isomorphic compiler', () => {
        const compiler = createCompiler(configClientBasic, configServerBasic);
        const middleware = webpackIsomorphicDevMiddleware(compiler, { watchOptions: false });

        expect(middleware.isomorphicCompiler).toBe(compiler);
    });

    it('should throw an error on invalid args', () => {
        expect(() => webpackIsomorphicDevMiddleware()).toThrow(/invalid arg/i);
    });
});
