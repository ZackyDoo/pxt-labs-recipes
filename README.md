# Full Sail Labs Recipes

Game-building blocks for [Microsoft MakeCode Arcade](https://arcade.makecode.com/).
Add the cyan **Labs** toolbox category to an ordinary Arcade project. No Labs
website or server is required.

## Install

1. Open or create a project at https://arcade.makecode.com/.
2. Open **Extensions** (in the toolbox or Settings menu).
3. Paste **https://github.com/ZackyDoo/pxt-labs-recipes** into the search field.
4. Select the extension, then open **Labs** in the Blocks toolbox.

The extension can be installed by URL; it is not yet listed in Arcade's curated
extension search results. Students do not need a GitHub account to use it.

## First game

Create a player sprite, then use **move mySprite with controls speed x 70 y 70**
in **on start**. Inside **on A button pressed**, use **shoot … from mySprite
forward speed 100**. The player remembers its last direction even when stopped.

For a complete example, switch to JavaScript, paste
[the movement and shooting demo](examples/facing-demo.ts), and switch back to
Blocks. [The rotating gun demo](examples/rotating-fire-demo.ts) demonstrates an
attached muzzle: left/right rotate the artwork, and A fires from the tip.

## Blocks

| Group | Block | Behavior |
| --- | --- | --- |
| Movement | Move with controls | Move with the directional buttons and remember facing. Horizontal input wins diagonal ties. |
| Movement | Set facing | Change logical facing without changing artwork or velocity. |
| Movement | Facing | Read the last logical facing direction. |
| Combat | Set fire point | Attach a firing point using offsets from the original image center. |
| Combat | Reset fire point | Restore logical-facing shooting and automatic anchors. Advanced block. |
| Combat | Shoot forward | Create and return a projectile, with optional anchor and offset. |
| Combat | Give health | Set a sprite's health and reset its damage cooldown. |
| Combat | Health | Read the sprite's current health. |
| Combat | Damage | Apply damage with temporary invulnerability; returns whether damage was applied. |
| Combat | Knock away | Temporarily push a sprite away from another sprite. Advanced block. |
| Enemies | Patrol | Move between two points; initially places the sprite at the first point. |
| Enemies | Follows | Follow another sprite and stop within the specified distance. |

Health belongs to the sprite, separately from Arcade's player life counter.
Reaching zero does not destroy the sprite automatically: use the health block
to decide what should happen. Movement, patrol, and following select one Labs
movement mode per sprite; the latest of these calls replaces the previous mode.
Avoid also using Arcade's move-with-buttons block on that same sprite.

### Attached fire points

Offsets are measured from the original artwork's center: positive x is right,
positive y is down. Set **forward** to the direction the unrotated artwork faces.
The firing point follows sprite rotation and scale. With an attached point, the
projectile's center starts at that point regardless of projectile size, the
anchor setting is ignored, and the optional offset moves it farther forward.
Without an attached point, shooting uses logical facing and the selected anchor.

## Scope and compatibility

This extension provides game blocks. The Labs site's sheet tabs, automatic
workspace organization, site theme, and custom simulator framing are editor
features and are not included. Camera and UI groups are reserved for future
blocks; this release supplies Movement, Combat, and Enemies.

The extension retains the site's `labs` APIs, enum values, and block IDs. Existing
games still need this GitHub extension dependency when moved to stock Arcade;
custom site metadata does not add sheet controls to the standard editor.

Automated compiler and Blocks conversion tests use unmodified Arcade 4.2.1 and
PXT Core 13.2.1. Hardware builds are not yet validated.

## Development

Use Node.js 18 or newer:

```sh
npm ci --ignore-scripts --omit=optional
npm test
npm run test:public
```

Only files listed in `pxt.json` are part of the extension. `test.ts` is a demo
when opening this repository as a project; it is not injected into students'
games when they install the extension. The npm dependencies are development
tools and are not shipped to students.

See [CONTRIBUTING.md](CONTRIBUTING.md) for releases and coordination with the site.

## License

MIT. See [LICENSE](LICENSE).

## Supported targets

* for PXT/arcade
