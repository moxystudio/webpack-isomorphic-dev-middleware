'use strict';

const webpackIsomorphicCompilerNotifier = require('webpack-isomorphic-compiler-notifier');
const webpackIsomorphicDevMiddleware = require('../');
const createCompiler = require('./util/createCompiler');
const configClientBasic = require('./configs/client-basic');
const configServerBasic = require('./configs/server-basic');

jest.mock('webpack-isomorphic-compiler-notifier', () => jest.fn((compiler) => compiler));

beforeEach(() => jest.clearAllMocks());

it('should not notify by default', () => {
    const compiler = createCompiler(configClientBasic, configServerBasic);

    webpackIsomorphicDevMiddleware(compiler, { report: false });
    compiler.watch = () => {};

    expect(webpackIsomorphicCompilerNotifier).toHaveBeenCalledTimes(0);
});

it('should notify if options.notify is NOT false', () => {
    const compiler = createCompiler(configClientBasic, configServerBasic);

    compiler.watch = () => {};

    webpackIsomorphicDevMiddleware(compiler, { report: false, notify: true });
    webpackIsomorphicDevMiddleware(compiler, { report: false, notify: {} });

    expect(webpackIsomorphicCompilerNotifier).toHaveBeenCalledTimes(2);
    expect(webpackIsomorphicCompilerNotifier).toHaveBeenCalledWith(compiler, {});
});

it('should pass options.notify to webpack-isomorphic-compiler-notifier', () => {
    const compiler = createCompiler(configClientBasic, configServerBasic);

    webpackIsomorphicDevMiddleware(compiler, {
        report: false,
        notify: { title: 'foo' },
    });
    compiler.watch = () => {};

    expect(webpackIsomorphicCompilerNotifier).toHaveBeenCalledTimes(1);
    expect(webpackIsomorphicCompilerNotifier).toHaveBeenCalledWith(compiler, { title: 'foo' });
});
