# Maintaining the Labs extension

This repository owns the standalone extension. The site continues in its own
repository; changes here do not modify or deploy the site.

Version 0.4.0 includes all 32 tools, the site-style metadata layer, shared inventory
and its menu, and lazy-start raycasting. Read `audit/compatibility.md` before
changing package identities or generated declarations. Regenerate metadata with
`npm run build:toolbox` after changing a pinned API. Preserve the conventional
dependency IDs so ordinary graphs reuse shared implementations.

Version 0.3.0 introduced a one-install 2D toolkit. Its 29 upstream
dependencies are pinned to the audited commits in `audit/addons.json`.
Run `npm run cache:addons` before compiler tests; this downloads original source
into ignored `built/` files for offline compilation. The test host normalizes
dependency locators only in that offline fixture. Student projects use the real
GitHub dependencies in pxt.json. Raycasting, split screen, and shadowcasting stay
optional in that historical release. Do not copy the other 31 implementations.

Version 0.2.0 imports the custom runtime from site commit
`365800a` (compact Donkey Kong platform tools), adds Labs-specific toolbox
categories and tooltip coverage, and isolates the inventory menu as an optional
add-on. Do not copy the site's 32 adapted vendor packages into core: use the
original extensions as dependencies so students can install them normally.
The core inventory namespace is `labsInventory`; block IDs stay unchanged.

## Origin and synchronization

Initial extraction: `ZackyDoo/LabsCode` commit
`1ce6ccc8b73cfd29911f2ad7453ee32ae766e007`, from
`arcade/libs/labs-recipes/recipes.ts`. The initial runtime is unchanged.
Examples and existing behavior/compiler tests were extracted from the same
Arcade folder. The compiler host now loads Microsoft's npm target directly.

Keep `labs` API names, enum numeric values, argument order, and existing
`blockId` values stable. Coordinate shared runtime changes by reviewing and
copying the specific recipe changes between repositories, running each one's
tests. Do not copy site editor code into the extension. Until automated sharing
is introduced, synchronization is a deliberate maintenance step.

## Validate a change

1. Run `npm ci --ignore-scripts --omit=optional`, `npm run cache:addons`, `npm test`, and `npm run test:public`.
2. Install the repository URL into a fresh project on public MakeCode Arcade.
3. Try both examples, use the simulator controls, and switch between Blocks
   and JavaScript. Confirm native Labs blocks remain editable.
4. Keep automated behavior tests for game mechanics and compiler coverage for
   public APIs. Update documentation when behavior changes.

`test:public` downloads the current public site's library bundle first, then
uses it with the pinned PXT compiler. This checks library compatibility; the
browser check also exercises the public site's actual compiler and runtime.
Tests intentionally refuse network downloads during compilation and do not
use the site's patched target or native/cloud firmware compilation.

## Release

Update `version` in `pxt.json` and `package.json` (and the npm lockfile), commit,
then create and push a matching `vX.Y.Z` Git tag after validation. Do not move
an existing version tag. Students can install by repository URL; published
versions give MakeCode a stable revision to resolve.

The repository is public so students can load it without credentials. Never
include deployment configuration, passwords, student projects, or private site
files in a release.
