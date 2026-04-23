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
