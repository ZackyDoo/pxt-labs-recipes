# Super extension compatibility

The standalone site groups were copied into `site-layout.json`; authored hover
explanations are in `site-tooltips.json`. `npm run build:toolbox` generates
`toolbox.d.ts` from the pinned libraries' actual public signatures. The file
contains declarations only, never function implementations or startup code.
PXT merges those annotations with upstream symbols, retaining block IDs and the
original library implementations. Namespace functions use a targeted TS2384
suppression because TypeScript otherwise rejects ambient metadata overloads of
an existing non-ambient function. Class methods use interface merging.

Tests check the resulting category, group, hidden state, tooltip, unique block
IDs, native Blocks conversion, and normal direct re-additions of shared package
IDs. Changes to a pinned dependency require regenerating metadata and rerunning
those tests. Do not hand-edit signatures or suppress unrelated diagnostics.

31 libraries remain normal original GitHub dependencies. Raycasting is the
site's isolated lazy-start compatibility adaptation, keeping its public API,
block IDs, license, and conventional package ID. Its source and two runtime
changes are documented in `libs/raycasting/README.md`.

This does not promise compatibility with every future extension or arbitrary
aliases. Two packages defining the same global API under different IDs can still
conflict, and two active camera/rendering systems may compete. Normal additions
that share the listed package IDs should reuse one library implementation.
