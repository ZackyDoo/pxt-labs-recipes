# Full Sail Labs game toolkit

Install in [MakeCode Arcade](https://arcade.makecode.com/) through **Extensions** by pasting:

`https://github.com/ZackyDoo/pxt-labs-recipes`

## Toolbox

The main install now includes the broad 2D toolkit automatically: sprite data,
timers, text sprites, tile tools, character animation, pathfinding, parallax,
save data, combos, grids, menus, dialogue, objects, colors, lighting, effects,
transitions, mazes, sprite events, camera offset, instruments, sound effects,
RTTTL, overworld maps, status bars, state transitions, tile scanning, and sprite
utilities. These 29 pinned upstream packages add 428 audited block definitions
alongside the 54 visible custom Labs blocks. Some blocks appear in More sections
or depend on editor context, so this is not a count of simultaneous toolbox rows.

Custom Labs blocks are grouped inside Arcade's existing **Sprites, Controller,
Scene, Game, Math, Animation, and Info** categories, following the standalone
Labs site. Original upstream packages retain their own toolbox categories.
Related custom Labs blocks
appear together under groups such as Combat, Physics, Sight, Camera, HUD,
Achievements, and Seeded random. Every custom Labs block has a hover explanation.
Some original upstream blocks have limited or missing hover documentation.
Existing Labs block IDs and
`labs` APIs are preserved. The redundant `is facing` comparison is hidden from
the toolbox but retained for older projects; use the facing reporter with equals.

The toolkit includes sprite platforms and slopes, ladders, fixed and forgiving
jumps, held tools, melee attacks, grid movement, shape-to-sprite layouts, room
cameras and transitions, health, inventory, achievements, seeded randomness,
and line of sight. See [BLOCKS.md](BLOCKS.md) for the full block reference.

## Optional add-ons

Raycasting, split screen, and shadowcasting remain optional because they change
rendering modes. See [ADDONS.md](ADDONS.md) for the full catalog and exact audited
revisions. The included 2D tools are normal original extension dependencies,
rather than copied implementations. Arcade can resolve shared dependencies when
another extension uses the same library. Specific controller, camera, and drawing
features can still conflict when enabled together; use one system per role.

The optional [Labs Inventory Menu](addons/inventory-menu/README.md) adds an item
chooser using the original Mini Menu extension. Bags themselves need no add-on.
The standalone inventory API is `labsInventory`, avoiding the generic
`inventory` namespace used on the site. Inventory block IDs are unchanged.

## Usage notes

* Choose one movement controller for each sprite. Labs movement modes and
  Arcade's move-with-buttons block can compete if enabled on the same sprite.
* Fixed jumps preserve their arc; forgiving jumps support early button presses,
  walking off edges, and releasing the button to shorten a jump.
* Tile ladders and sprite ladders serve different map types. Single-platform
  registration and platform-kind registration likewise cover different cases.
* Held-tool swings and timed melee attacks have different control/attack rules.
* Sprite health is separate from the player life counter. Zero health does not
  automatically destroy a sprite.
* Room cameras/transitions take camera control only when called. Do not run two
  camera controllers at once. Alternate renderers are optional and can change
  how sprites, HUDs, and tilemaps are displayed.
* The site editor's sheets, branding, and simulator patches are not included.
  No simulator code or global Arcade API is replaced by this extension.

## Examples and validation

[Movement and shooting](examples/facing-demo.ts) and
[rotating fire points](examples/rotating-fire-demo.ts) are ready to paste into
JavaScript and convert back to Blocks.

```sh
npm ci --ignore-scripts --omit=optional
npm run cache:addons
npm test
npm run test:public
```

The automated checks cover block metadata, native Blocks conversion, shared
dependencies, and mechanics. Compiler checks use unmodified Arcade libraries. The add-on
audit checks original upstream source revisions, not the site's adapted copies.
Compile success does not guarantee every combination of renderers or controllers
works at runtime. Hardware builds are not validated.

`test.ts` runs only when opening this repository as a project; it is not added to
students' games when installed as an extension. MIT; see [LICENSE](LICENSE).

## Supported targets

* for PXT/arcade
