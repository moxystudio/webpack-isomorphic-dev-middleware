'use strict';

const saneNotifier = require('webpack-sane-compiler-notifier');
const webpackIsomorphicDevMiddleware = require('../');
const createCompiler = require('./util/createCompiler');
const configClientBasic = require('./configs/client-basic');
const configServerBasic = require('./configs/server-basic');

jest.mock('webpack-sane-compiler-notifier', () => jest.fn((compiler) => compiler));

beforeEach(() => jest.clearAllMocks());

it('should not notify by default', () => {
    const compiler = createCompiler(configClientBasic, configServerBasic);

    webpackIsomorphicDevMiddleware(compiler, { report: false });
    compiler.watch = () => {};

    expect(saneNotifier).toHaveBeenCalledTimes(0);
});

it('should notify if options.notify is NOT false', () => {
    const compiler = createCompiler(configClientBasic, configServerBasic);

    compiler.watch = () => {};

    webpackIsomorphicDevMiddleware(compiler, { report: false, notify: true });
    webpackIsomorphicDevMiddleware(compiler, { report: false, notify: {} });

    expect(saneNotifier).toHaveBeenCalledTimes(2);
    expect(saneNotifier).toHaveBeenCalledWith(compiler, {});
});

it('should pass options.notify to webpack-isomorphic-compiler-notifier', () => {
    const compiler = createCompiler(configClientBasic, configServerBasic);

    webpackIsomorphicDevMiddleware(compiler, {
        report: false,
        notify: { title: 'foo' },
    });
    compiler.watch = () => {};

    expect(saneNotifier).toHaveBeenCalledTimes(1);
    expect(saneNotifier).toHaveBeenCalledWith(compiler, { title: 'foo' });
});
