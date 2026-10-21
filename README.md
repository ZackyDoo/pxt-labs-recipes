# Full Sail Labs game toolkit

Install in [MakeCode Arcade](https://arcade.makecode.com/) through **Extensions** by pasting:

`https://github.com/ZackyDoo/pxt-labs-recipes`

## Toolbox

The main install includes the full toolkit automatically: sprite data,
timers, text sprites, tile tools, character animation, pathfinding, parallax,
save data, combos, grids, menus, dialogue, objects, colors, lighting, effects,
transitions, mazes, sprite events, camera offset, instruments, sound effects,
RTTTL, overworld maps, status bars, state transitions, tile scanning, and sprite
utilities, split screen, shadows, and 3D raycasting. All 32 tool libraries are
included. The inventory item chooser is included too. Redundant and deprecated
blocks are hidden as on the standalone site, with their APIs retained for older
projects. Some blocks appear in More sections or depend on editor context.

Custom Labs blocks are grouped inside Arcade's existing **Sprites, Controller,
Scene, Game, Math, Animation, and Info** categories, following the standalone
Labs site. A declaration-only metadata layer also moves upstream tools into the
site's categories and groups: data/status bars/spatial tools in Sprites,
timers/save data/states in Game, tilemaps/camera/lighting/transitions/split screen
in Scene, and instruments/sound effects in Music. Menus, dialogue, objects,
custom effects, Inventory, and 3D View retain their focused categories.
Related blocks
appear together under groups such as Combat, Physics, Sight, Camera, HUD,
Achievements, and Seeded random. Every custom Labs block has a hover explanation.
Upstream tooltips are preserved or supplemented with the site's explanations.
Existing Labs block IDs and
`labs` APIs are preserved. The redundant `is facing` comparison is hidden from
the toolbox but retained for older projects; use the facing reporter with equals.

The toolkit includes sprite platforms and slopes, ladders, fixed and forgiving
jumps, held tools, melee attacks, grid movement, shape-to-sprite layouts, room
cameras and transitions, health, inventory, achievements, seeded randomness,
and line of sight. See [BLOCKS.md](BLOCKS.md) for the full block reference.

## Shared libraries and rendering modes

See [ADDONS.md](ADDONS.md) for the full catalog and exact audited revisions.
31 libraries are original extension dependencies. Raycasting uses the site's
isolated compatibility adaptation so it initializes only when used; importing
Labs does not start a first-person game. Its public Render API and block IDs are
preserved. See [compatibility details](audit/compatibility.md).

The [Labs Inventory Menu](addons/inventory-menu/README.md) is now included and
shares the original Mini Menu dependency. Bags and the chooser use a shared
inventory package without circular dependencies.
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
  camera controllers at once. The available alternate renderers can change
  how sprites, HUDs, and tilemaps are displayed.
* The site editor's sheets, branding, and simulator patches are not included.
  The extension does not modify the hosted simulator. Explicitly enabling a
  renderer changes that game's drawing behavior, as it does on the site.

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
