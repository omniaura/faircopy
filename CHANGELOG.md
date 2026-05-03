# [1.5.0](https://github.com/omniaura/faircopy/compare/v1.4.0...v1.5.0) (2026-05-03)


### Features

* **rules-nlp:** flag empty transformation claims ([#9](https://github.com/omniaura/faircopy/issues/9)) ([c798ecf](https://github.com/omniaura/faircopy/commit/c798ecf8e12da92ef033f84420e280fadae1068b))

# [1.4.0](https://github.com/omniaura/faircopy/compare/v1.3.0...v1.4.0) (2026-04-27)


### Features

* Add optional NLP ruleset with bare rule IDs ([#8](https://github.com/omniaura/faircopy/issues/8)) ([ff249ca](https://github.com/omniaura/faircopy/commit/ff249ca9483aacece3d3b443037cdf9d1b994884))

# [1.3.0](https://github.com/omniaura/faircopy/compare/v1.2.1...v1.3.0) (2026-04-27)


### Features

* add nlp copy rules ([#6](https://github.com/omniaura/faircopy/issues/6)) ([90fb076](https://github.com/omniaura/faircopy/commit/90fb076c98fe8ba412cbfe0bfa4851e4311c9257))

## [1.2.1](https://github.com/omniaura/faircopy/compare/v1.2.0...v1.2.1) (2026-04-27)


### Bug Fixes

* trigger release ([52067de](https://github.com/omniaura/faircopy/commit/52067dee0d155fd76147208ce696a24f45371bc2))

# [1.2.0](https://github.com/omniaura/faircopy/compare/v1.1.1...v1.2.0) (2026-04-24)


### Features

* add agent compact reporting ([#3](https://github.com/omniaura/faircopy/issues/3)) ([688fc25](https://github.com/omniaura/faircopy/commit/688fc25e782e185785e9efd5faa6c1f9c8f18bdf))

## [1.1.1](https://github.com/omniaura/faircopy/compare/v1.1.0...v1.1.1) (2026-04-23)


### Bug Fixes

* trigger release to publish all packages via trusted publisher ([aa75154](https://github.com/omniaura/faircopy/commit/aa75154477fc4ef43ab3f470c1ecdefd74a50fe3))

# [1.1.0](https://github.com/omniaura/faircopy/compare/v1.0.6...v1.1.0) (2026-04-23)


### Features

* add @faircopy/react and @faircopy/solid adapters ([3e711a4](https://github.com/omniaura/faircopy/commit/3e711a48cfd6b64ea2dcab49954c06f59f13f42f))

## [1.0.6](https://github.com/omniaura/faircopy/compare/v1.0.5...v1.0.6) (2026-04-23)


### Bug Fixes

* add repository.url to packages missing it for npm provenance ([029ffad](https://github.com/omniaura/faircopy/commit/029ffad970b43009e538645040bacb45f366e6fd))

## [1.0.5](https://github.com/omniaura/faircopy/compare/v1.0.4...v1.0.5) (2026-04-23)


### Bug Fixes

* upgrade npm to 11.5.1+ for OIDC trusted publishing support ([3826ef5](https://github.com/omniaura/faircopy/commit/3826ef53addbdc661baa32a98db48f950a4dad90))
* use Node 24 which ships with npm 11 for OIDC trusted publishing ([5540d3a](https://github.com/omniaura/faircopy/commit/5540d3a4cfe7e08a7be71a25bce41b357ebf8a61))

## [1.0.4](https://github.com/omniaura/faircopy/compare/v1.0.3...v1.0.4) (2026-04-23)


### Bug Fixes

* use npm publish per-package for OIDC trusted publisher support ([78c0916](https://github.com/omniaura/faircopy/commit/78c0916f93bf9564db466976cafc62427df5e337))

## [1.0.3](https://github.com/omniaura/faircopy/compare/v1.0.2...v1.0.3) (2026-04-23)


### Bug Fixes

* remove NPM_TOKEN, use OIDC trusted publishing like solid-grab ([0e8bb8c](https://github.com/omniaura/faircopy/commit/0e8bb8c8bb6d74f2aa60d0098fd9fe83999f7248))

## [1.0.2](https://github.com/omniaura/faircopy/compare/v1.0.1...v1.0.2) (2026-04-23)


### Bug Fixes

* add NPM_TOKEN auth to publish step ([2c8731a](https://github.com/omniaura/faircopy/commit/2c8731ab628914c1704e374ead47fe9d7bb377a5))

## [1.0.1](https://github.com/omniaura/faircopy/compare/v1.0.0...v1.0.1) (2026-04-23)


### Bug Fixes

* bump all workspace packages in release prepareCmd ([3c84a4b](https://github.com/omniaura/faircopy/commit/3c84a4b6fae4579aa3f06f726a8971fead20f9a9))
* remove glob dep from bump script, use fs.readdirSync ([2a8dce7](https://github.com/omniaura/faircopy/commit/2a8dce7012b03fb9d8d91cde165292e2e4a8fce4))
* use node script to bump workspace package versions for release ([ce574eb](https://github.com/omniaura/faircopy/commit/ce574ebd29cba8833672001735be65180a3cfcc1))

# 1.0.0 (2026-04-23)


### Bug Fixes

* drop bun from CI, use npx for semantic-release ([c0ceeee](https://github.com/omniaura/faircopy/commit/c0ceeeea63ad1730309e78986745d03873a2dbd0))
* install bun before pnpm test in CI and Release workflows ([2b6dea5](https://github.com/omniaura/faircopy/commit/2b6dea56f30b1e924e2f0165acf92eeae18b5e4b))
* resolve user project node_modules when loading config ([2f52648](https://github.com/omniaura/faircopy/commit/2f526480881b1839bfc003ff7d323634b6624791))
* update pnpm lockfile for faircopy workspace deps ([cf7b09f](https://github.com/omniaura/faircopy/commit/cf7b09f7a8d1a08d1f4ac0ee7f77ad4180942064))


### Features

* add READMEs, faircopy meta-package, and ./cli export ([6fd777e](https://github.com/omniaura/faircopy/commit/6fd777ef00529d97fa3fc25d190114b8f31e16ba))
* M1 — three rules, Astro adapter, defineConfig ([1b00b1a](https://github.com/omniaura/faircopy/commit/1b00b1a04479a6cbf0cf1dfe2440db450959c6f5))
* M2 — Claude Code stop hook + agent skill plugin ([2b36ce2](https://github.com/omniaura/faircopy/commit/2b36ce2429c9db89012511b1bbeb20952813a4c4))
* scaffold faircopy monorepo (M0) ([0010d17](https://github.com/omniaura/faircopy/commit/0010d179e35d65a8c1b9ca7d22718250100ac91b))
