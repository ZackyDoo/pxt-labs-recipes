# Full Sail Labs game toolkit

Install in [MakeCode Arcade](https://arcade.makecode.com/) through **Extensions** by pasting:

`https://github.com/ZackyDoo/pxt-labs-recipes`

## Toolbox

54 visible core blocks are organized into **Labs Movement, Combat, Enemies,
Platforms, Animation, World, Camera, HUD, Achievements, Random, Sight, and
Inventory**. Every block has a hover explanation. Existing Labs block IDs and
`labs` APIs are preserved. The redundant `is facing` comparison is hidden from
the toolbox but retained for older projects; use the facing reporter with equals.

The toolkit includes sprite platforms and slopes, ladders, fixed and forgiving
jumps, held tools, melee attacks, grid movement, shape-to-sprite layouts, room
cameras and transitions, health, inventory, achievements, seeded randomness,
and line of sight. See [BLOCKS.md](BLOCKS.md) for the full block reference.

## Optional add-ons

Core depends only on standard Arcade. It does not copy third-party extension
implementations or automatically enable a renderer, controller, or camera system.
Install original third-party extensions separately as needed; see
[ADDONS.md](ADDONS.md) for the 32 reviewed tools and exact audited revisions.

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
npm test
npm run test:public
```

The 42 automated checks cover block metadata, native Blocks conversion, and
mechanics. Compiler checks use unmodified Arcade libraries. The optional add-on
audit checks original upstream source revisions, not the site's adapted copies.
Compile success does not guarantee every combination of renderers or controllers
works at runtime. Hardware builds are not validated.

`test.ts` runs only when opening this repository as a project; it is not added to
students' games when installed as an extension. MIT; see [LICENSE](LICENSE).

## Supported targets

* for PXT/arcade
