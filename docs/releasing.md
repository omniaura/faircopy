# Releasing Faircopy

Every public workspace package shares one version. Releases run through
`.github/workflows/publish.yml` on GitHub-hosted runners using npm trusted
publishing; no long-lived npm token is needed.

Before adding a public package, publish its first version from an authorized npm
maintainer account, then configure its npm **Trusted Publisher** for GitHub Actions:

- Organization: `omniaura`
- Repository: `faircopy`
- Workflow filename: `publish.yml`
- Environment: leave blank
- Allowed actions: enable direct publishing with `npm publish`

The preflight exchanges the workflow's OIDC identity for each public package
before semantic-release tags or publishes anything. Missing packages and publisher
mismatches stop the workflow with links to their npm settings. A successful
exchange verifies authentication; it cannot guarantee that every later publish
will succeed or make a multi-package release atomic.

CI runs `pnpm build`, `pnpm typecheck`, and `pnpm test`. The test command includes
isolated release-script regressions that mock the registry and publisher; those
tests never publish packages or use real credentials.

## Recovery modes

Run these from the repository's default branch:

```sh
# Check all package publishers without tagging or publishing.
gh workflow run publish.yml --repo omniaura/faircopy --ref main -f mode=preflight

# Retry semantic-release after a preflight failure, before any tag was created.
gh workflow run publish.yml --repo omniaura/faircopy --ref main -f mode=release

# Complete an existing partial release at the committed workspace version.
gh workflow run publish.yml --repo omniaura/faircopy --ref main -f mode=resume
```

`resume` uses the version committed on main and skips package versions already
visible on npm. It restores temporary manifest changes after each publish attempt
and reports packages still missing or unconfirmed. A registry lookup failure does
not authorize overwriting an existing version. Inspect the failure before retrying;
the version guards reject a request that differs from the workspace manifests.

After a run, verify that all public packages exist at the intended version and
that their `latest` tags agree. Exercise the installed CLI's `--version` and lint
behavior. A Git tag, GitHub release, successful upload, or package's first appearance
alone does not establish that the whole release is available. Website consumers
must update their lockfile and deploy before the playground uses the new rules.
