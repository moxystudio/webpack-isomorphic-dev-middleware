# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="4.0.1"></a>
## [4.0.1](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v4.0.0...v4.0.1) (2018-03-10)


### Bug Fixes

* do not print webpack errors to console ([0a68c97](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/0a68c97))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v3.2.2...v4.0.0) (2018-03-06)


### Features

* support webpack v4 ([#54](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/issues/54)) ([4b68325](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/4b68325))


### BREAKING CHANGES

* a peer dependency warning appears when using webpack v2 and v3, so it's safer to release this as a major



<a name="3.2.2"></a>
## [3.2.2](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v3.2.1...v3.2.2) (2018-02-27)



<a name="3.2.1"></a>
## [3.2.1](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v3.2.0...v3.2.1) (2018-02-27)


### Bug Fixes

* check hashes on second recompilation (rebuild) ([#51](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/issues/51)) ([9c32b1a](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/9c32b1a))



<a name="3.2.0"></a>
# [3.2.0](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v3.1.0...v3.2.0) (2018-02-03)


### Bug Fixes

* **package:** update webpack-isomorphic-compiler to version 3.0.0 ([726552e](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/726552e))


### Features

* update webpack-isomorphic-compiler to v3 ([58b63ea](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/58b63ea))



<a name="3.1.0"></a>
# [3.1.0](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v3.0.1...v3.1.0) (2018-01-15)


### Bug Fixes

* **package:** update compose-middleware to version 4.0.0 ([40db91f](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/40db91f))


### Features

* only override the compiler's output `fs` when `memoryFs` is true ([89ae9b8](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/89ae9b8))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v3.0.0...v3.0.1) (2017-12-21)


### Bug Fixes

* fix print of errors to console ([3eb2c7f](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/3eb2c7f))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v2.0.1...v3.0.0) (2017-12-18)


### Chores

* update webpack-isomorphic-compiler and res.locals signature ([95787fa](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/95787fa))


### BREAKING CHANGES

* webpack-isomorphic-compiler now accepts different values for the `report` option.
* res.locals signature has changed



<a name="2.0.1"></a>
## [2.0.1](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v2.0.0...v2.0.1) (2017-12-06)


### Bug Fixes

* fix check of human errors accessing undefined stats in some cases ([553a401](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/553a401))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v1.5.0...v2.0.0) (2017-11-14)


### Features

* add options.watchDelay ([c33ce18](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/c33ce18))


### BREAKING CHANGES

* remove ability to pass false to options.watchDelay



<a name="1.5.0"></a>
# [1.5.0](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/compare/v1.4.1...v1.5.0) (2017-11-13)


### Features

* add notify option ([af6b36a](https://github.com/moxystudio/webpack-isomorphic-dev-middleware/commit/af6b36a))
