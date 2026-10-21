# Labs block reference

### game: unlockAchievement

Remember that this achievement was earned in this project on this browser or device. True means it was just earned; earning it again returns false and does not repeat its event.

### game: achievementUnlocked

True if this project has already saved this achievement as earned on the current browser or device.

### game: onAchievementUnlocked

Run this code once when any new achievement is earned. The name tells you which one; use normal text, sound or effects blocks to celebrate it. Previously saved achievements do not fire this event again.

### game: resetAchievement

Forget only this saved achievement so it can be earned again. Other achievements and saved game data are kept.

### animation: animatePlatformer

Stateful mechanics that are not supplied by individual stock Arcade blocks. / namespace labs { class ClassicActor { sprite: Sprite; platforms: Sprite[] = []; platformKinds: number[] = []; ladderKinds: number[] = []; activeLadder: Sprite; rolling: number = 0; rollDirection: number = 1; rollSupport: Sprite; rollLadderKind: number = -1; rollChance: number = 0; rollLadder: Sprite; rollLastX: number = 0; rollSeen: Sprite; rollPatrol: boolean = false; rollLadderDirection: number = 1; fixedJump: boolean = false; airVX: number = 0; jumpClimbEnabled: boolean = true; jumpHandlers: ((count: number) => void)[] = []; jumpKinds: number[] = []; jumped: Sprite[] = []; wasGrounded: boolean = false; jumping: boolean = false; jumpBottom: number = 0; motionFrames: Image[][]; motionInterval: number = 100; motionRight: boolean = true; motionLast: Image; motionLastRight: boolean = false; climbFrame: number = 0; heldTool: Sprite; heldFrames: Image[]; heldPoses: Image[]; heldUntil: number = 0; heldStart: number = 0; heldReach: number = 16; heldInterval: number = 100; heldHeavy: boolean = false; heldControls: boolean = true; support: Sprite; supportX: number = 0; supportY: number = 0; previousBottom: number = 0; dropUntil: number = 0; jumpSpeed: number = 0; grace: number = 100; buffer: number = 120; lastGround: number = -100000; jumpUntil: number = -100000; jumpHeld: boolean = false; ladder: Image; climbSpeed: number = 50; climbing: boolean = false; savedGravity: number = 0; walkSpeed: number = 0; fourWay: boolean = false; axis: number = 0; queuedAxis: number = 0; lastDX: number = 0; lastDY: number = 0; turnGrid: number = 0; originX: number = 0; originY: number = 0; lockUntil: number = 0; footprint: number[]; weapon: Sprite; attackStart: number = -100000; windup: number = 0; active: number = 0; recovery: number = 0; reach: number = 0; attackDirection: number = 0; hop: number[]; hopThroughWalls: boolean = false; constructor() { } } function classic(sprite: Sprite): ClassicActor { let a: ClassicActor = sprite.data['__labsClassicActor_v1']; if (a) return a; a = new ClassicActor(); a.sprite = sprite; a.previousBottom = sprite.bottom; sprite.data['__labsClassicActor_v1'] = a; const current = game.currentScene(); let actors: ClassicActor[] = current.data['__labsClassicActors_v1']; if (!actors) { actors = []; current.data['__labsClassicActors_v1'] = actors; current.eventContext.registerFrameHandler(scene.PHYSICS_PRIORITY - 1, () => { for (let i = actors.length - 1; i >= 0; i--) { if (actors[i].sprite.flags & sprites.Flag.Destroyed) { finishTool(actors[i]); if (actors[i].weapon) { actors[i].weapon.setFlag(SpriteFlag.Invisible, true); actors[i].weapon.setFlag(SpriteFlag.GhostThroughSprites, true); } actors.removeAt(i); } else beforePhysics(actors[i]); } }); current.eventContext.registerFrameHandler(scene.PHYSICS_PRIORITY + 1, () => { for (let i = 0; i < actors.length; i++) afterPhysics(actors[i]); }); } actors.push(a); return a; } function beforePhysics(a: ClassicActor) { const s = a.sprite, now = game.runtime(); if (a.heldTool && (now >= a.heldUntil || a.heldTool.flags & sprites.Flag.Destroyed)) finishTool(a); for (let kind of a.platformKinds) for (let platform of sprites.allOfKind(kind)) { if (platform != s && a.platforms.indexOf(platform) < 0) a.platforms.push(platform); } const dx = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0); const dy = (controller.down.isPressed() ? 1 : 0) - (controller.up.isPressed() ? 1 : 0); const jump = controller.A.isPressed(); const push = s.data['__fullSailLabsRecipes_v1']; const pushed = push && now < push.knockbackUntil; if (a.fourWay && !pushed) { let requested = a.queuedAxis || a.axis; if (dx && !a.lastDX) requested = 1; if (dy && !a.lastDY) requested = 2; if (!dx && dy) requested = 2; if (!dy && dx) requested = 1; if (!dx && !dy) requested = a.axis; a.queuedAxis = requested; if (a.axis && a.turnGrid > 0 && requested != a.axis) { const coordinate = a.axis == 1 ? s.x - a.originX : s.y - a.originY; const positive = labs.facing(s) == LabsFacing.Right || labs.facing(s) == LabsFacing.Down; let snapped = (positive ? Math.ceil(coordinate / a.turnGrid) : Math.floor(coordinate / a.turnGrid)) a.turnGrid; const tolerance = Math.max(1, a.walkSpeed game.currentScene().eventContext.deltaTimeMillis / 1000); const blocked = a.axis == 1 ? s.isHittingTile(CollisionDirection.Left) || s.isHittingTile(CollisionDirection.Right) : s.isHittingTile(CollisionDirection.Top) || s.isHittingTile(CollisionDirection.Bottom); if (blocked) { // A shove or a teleport can leave the feet between lanes at a wall. // Back up to the last lane instead of pushing into the wall forever. snapped = (positive ? Math.floor(coordinate / a.turnGrid) : Math.ceil(coordinate / a.turnGrid)) a.turnGrid; } if (blocked || Math.abs(coordinate - snapped) <= tolerance) { if (a.axis == 1) s.x = snapped + a.originX; else s.y = snapped + a.originY; a.axis = requested; } } else a.axis = requested; s.vx = a.axis == 1 ? dx a.walkSpeed : 0; s.vy = a.axis == 2 ? dy a.walkSpeed : 0; // Continue to the next lane when a turn is queued between grid lines. if (a.turnGrid > 0 && requested != a.axis) { if (a.axis == 1) s.vx = (labs.facing(s) == LabsFacing.Left ? -1 : 1) a.walkSpeed; else s.vy = (labs.facing(s) == LabsFacing.Up ? -1 : 1) a.walkSpeed; } if (now < a.lockUntil) { s.vx = 0; s.vy = 0; } if (s.vx) labs.setFacing(s, s.vx > 0 ? LabsFacing.Right : LabsFacing.Left); else if (s.vy) labs.setFacing(s, s.vy > 0 ? LabsFacing.Down : LabsFacing.Up); a.lastDX = dx; a.lastDY = dy; } if (pushed) { s.vx = push.kx; s.vy = push.ky; a.attackStart = -100000; a.lockUntil = now; } if (a.footprint) { const f = a.footprint; if (!s._hitbox || !s._hitbox.isValid() || s._hitbox.width != Fx8(f[0]) || s._hitbox.height != Fx8(f[1]) || s._hitbox.ox != Fx8(f[2]) || s._hitbox.oy != Fx8(f[3])) s._hitbox = new game.Hitbox(s, Fx8(f[0]), Fx8(f[1]), Fx8(f[2]), Fx8(f[3])); } if (a.hop) { const h = a.hop, t = Math.min(1, Math.max(0, (now - h[0]) / h[1])); s.vx = 0; s.vy = 0; s.setPosition(h[2] + (h[4] - h[2]) t, h[3] + (h[5] - h[3]) t - h[6] 4 t (1 - t)); if (t >= 1) { a.hop = null; s.setFlag(SpriteFlag.GhostThroughWalls, a.hopThroughWalls); } } if (a.weapon && !(a.weapon.flags & sprites.Flag.Destroyed)) { const elapsed = now - a.attackStart; const visible = elapsed >= a.windup && elapsed < a.windup + a.active; a.weapon.setFlag(SpriteFlag.Invisible, !visible); a.weapon.setFlag(SpriteFlag.GhostThroughSprites, !visible); const direction = a.attackDirection; a.weapon.setPosition(s.x + (direction == LabsFacing.Right ? a.reach : direction == LabsFacing.Left ? -a.reach : 0), s.y + (direction == LabsFacing.Down ? a.reach : direction == LabsFacing.Up ? -a.reach : 0)); } let onLadder = false; if (a.ladder && game.currentScene().tileMap && game.currentScene().tileMap.data) { // TileDirection.Bottom checks a whole neighboring tile, not the feet. // That kept gravity paused even after a climber had cleared a ladder. const size = 1 << game.currentScene().tileMap.scale; const feet = tiles.getTileLocation(Math.floor(s.x / size), Math.floor((s.bottom - 1) / size)); onLadder = s.tileKindAt(TileDirection.Center, a.ladder) || tiles.tileAtLocationEquals(feet, a.ladder); } let ladder: Sprite = null; if (a.jumpClimbEnabled && !a.rolling) for (let kind of a.ladderKinds) for (let candidate of sprites.allOfKind(kind)) { if (Math.abs(s.x - candidate.x) <= Math.max(4, candidate.width / 2) && s.vy >= 0 || a.climbing) { const feet = s.bottom; if (Math.abs(s.x - candidate.x) <= Math.max(4, candidate.width / 2) && ((dy < 0 && feet > candidate.top + (a.climbing ? 0 : 0.5) && feet <= candidate.bottom + 3) || (dy > 0 && feet >= candidate.top - 2 && feet < candidate.bottom - (a.climbing ? 0 : 0.5)) || (!dy && a.activeLadder == candidate && feet > candidate.top && feet < candidate.bottom))) ladder = candidate; } } a.activeLadder = ladder; onLadder = onLadder || !!ladder; if (a.jumpClimbEnabled && (a.ladder || ladder) && onLadder && (dy || a.climbing) && (!jump || a.fixedJump)) { if (!a.climbing) a.savedGravity = s.ay; a.climbing = true; s.ay = 0; s.vy = dy a.climbSpeed; a.support = null; if (ladder) { s.x = ladder.x; s.vx = 0; } } else if (a.climbing) { a.climbing = false; s.ay = a.savedGravity; } if (a.jumpSpeed > 0 && a.jumpClimbEnabled) { if (jump && !a.jumpHeld) a.jumpUntil = now + a.buffer; if (a.jumpUntil >= now && (a.support || s.isHittingTile(CollisionDirection.Bottom) || now - a.lastGround <= a.grace || (!a.fixedJump && onLadder))) { s.vy = -a.jumpSpeed; a.support = null; a.lastGround = -100000; a.jumpUntil = -100000; a.airVX = s.vx; a.jumpBottom = s.bottom; a.jumping = true; a.jumped = []; } // Releasing A shortens a jump; holding A preserves the full jump. if (!a.fixedJump && !jump && a.jumpHeld && s.vy < 0) s.vy = 0.5; } if (a.fixedJump && a.jumping) s.vx = a.airVX; if (a.rolling) updateRolling(a); a.jumpHeld = jump; a.previousBottom = s.bottom; } function surfaceY(platform: Sprite, x: number): number { if (x < platform.left || x >= platform.right || !platform.width || !platform.height) return -100000; const column = Math.min(platform.image.width - 1, Math.max(0, Math.floor((x - platform.left) platform.image.width / platform.width))); for (let y = 0; y < platform.image.height; y++) { if (platform.image.getPixel(column, y)) return platform.top + y platform.height / platform.image.height; } return -100000; } function afterPhysics(a: ClassicActor) { const s = a.sprite, now = game.runtime(); if (a.activeLadder && a.climbing && (s.bottom <= a.activeLadder.top || s.bottom >= a.activeLadder.bottom)) { s.bottom = s.bottom <= a.activeLadder.top ? a.activeLadder.top : a.activeLadder.bottom; a.previousBottom = s.bottom; a.climbing = false; s.ay = a.savedGravity; s.vy = 0; a.activeLadder = null; } let support: Sprite = null, top = 100000; if (a.support && !(a.support.flags & sprites.Flag.Destroyed) && s.vy >= 0 && now >= a.dropUntil) { s.x += a.support.x - a.supportX; } for (let i = a.platforms.length - 1; i >= 0; i--) { const p = a.platforms[i]; if (p.flags & sprites.Flag.Destroyed) { a.platforms.removeAt(i); continue; } if (s.vy < 0 || now < a.dropUntil || p.rotation != 0 || a.climbing) continue; // Sample both feet. Painted slopes and transparent gaps become real surfaces. const inset = Math.min(2, s.width / 4); const left = surfaceY(p, s.left + inset), right = surfaceY(p, s.right - inset - 0.1); let y = left == -100000 ? right : right == -100000 ? left : Math.min(left, right); if (y == -100000) continue; const carried = a.support == p && Math.abs(s.bottom - y) <= Math.max(8, Math.abs(p.y - a.supportY) + Math.abs(s.vx) game.currentScene().eventContext.deltaTimeMillis / 1000 + 2); const crossed = a.previousBottom <= y + 1 && s.bottom >= y; if ((carried || crossed) && y < top) { top = y; support = p; } } a.support = support; if (support) { s.bottom = top; s.vy = 0; a.supportX = support.x; a.supportY = support.y; } if (!a.climbing && s.vy >= 0 && (support || s.isHittingTile(CollisionDirection.Bottom))) a.lastGround = now; if (a.jumping) for (let kind of a.jumpKinds) for (let obstacle of sprites.allOfKind(kind)) { if (obstacle != s && a.jumpBottom > obstacle.top + 2 && Math.abs(s.x - obstacle.x) <= (s.width + obstacle.width) / 2 && s.bottom <= obstacle.top + 2 && s.bottom >= obstacle.top - 32 && a.jumped.indexOf(obstacle) < 0) a.jumped.push(obstacle); } const grounded = !!support || s.isHittingTile(CollisionDirection.Bottom); if (grounded && s.vy >= 0 && a.jumping) { a.jumping = false; if (a.jumped.length) for (let i = 0; i < a.jumpHandlers.length; i++) { const handler = a.jumpHandlers[i]; let count = 0; for (let obstacle of a.jumped) if (obstacle.kind() == a.jumpKinds[i]) count++; if (count) control.runInParallel(() => handler(count)); } a.jumped = []; } a.wasGrounded = grounded; animatePlatformActor(a); } function finishTool(a: ClassicActor) { if (!a.heldTool) return; a.heldTool.setFlag(SpriteFlag.Invisible, true); a.heldTool.setFlag(SpriteFlag.GhostThroughSprites, true); if (a.heldHeavy) a.jumpClimbEnabled = a.heldControls; a.heldTool = null; a.heldUntil = 0; } function animatePlatformActor(a: ClassicActor) { const s = a.sprite, now = game.runtime(); if (s.vx) a.motionRight = s.vx > 0; const phase = Math.floor((now - a.heldStart) / a.heldInterval); if (a.heldTool) { const sideways = phase % 2 != 0; a.heldTool.setImage(a.heldFrames[phase % a.heldFrames.length].clone()); if (a.motionRight && sideways) a.heldTool.image.flipX(); a.heldTool.setPosition(s.x + (sideways ? (a.motionRight ? a.heldReach : -a.heldReach) : 0), s.y - (sideways ? 0 : a.heldReach)); } if (!a.motionFrames) return; let frames = a.motionFrames[0], mirror = a.motionRight; let frame = Math.floor(now / a.motionInterval); if (a.heldTool && a.heldPoses && a.heldPoses.length) { frames = a.heldPoses; frame = phase; } else if (a.climbing) { frames = a.motionFrames[3]; mirror = false; if (s.vy) a.climbFrame += game.currentScene().eventContext.deltaTimeMillis; frame = Math.floor(a.climbFrame / a.motionInterval); } else if (!a.support && !s.isHittingTile(CollisionDirection.Bottom)) frames = a.motionFrames[2]; else if (s.vx) frames = a.motionFrames[1]; if (!frames || !frames.length) return; const picture = frames[frame % frames.length]; if (picture != a.motionLast || mirror != a.motionLastRight) { s.setImage(picture.clone()); if (mirror) s.image.flipX(); a.motionLast = picture; a.motionLastRight = mirror; } } / Choose pictures automatically from platform contact and ladder state: standing, walking, airborne, or climbing. Draw the character facing left; it mirrors when moving right and keeps facing at rest. A paused climber stops animating.

### scene: roomCamera

Keep the camera in one grid room until the player crosses an edge, then slide to the next room. Use instead of camera follow.

### sprites: setFirePoint

Attach a firing point to the artwork. x/y are image pixels from its center, before rotation or scaling (right/down are positive). Forward describes the artwork at zero degrees. The point and direction follow rotation (degrees).

### sprites: clearFirePoint

Return to logical facing and the shoot block's automatic anchor.

### sprites: shootForward

Shoot from the attached fire point when configured; it follows the sprite's rotation and scale, and replaces automatic anchor placement. Offset adds world pixels along the firing direction. Without a fire point, use logical facing.

### sprites: giveHealth

Set this sprite's health and clear its damage cooldown. This is separate from the built-in player life counter.

### sprites: health

Read this sprite's remaining health. A sprite without assigned health returns zero.

### sprites: damage

Returns whether damage was applied; health reaching zero does not destroy the sprite automatically.

### sprites: knockback

Temporarily push a sprite away from another sprite, then restore its prior velocity or Labs movement mode.

### sprites: swingHeldTool

Repeatedly swing a tool above and in front of this character for a set time. Frames alternate between raised and lowered pictures. Only the tool's real sprite can hit enemies; the character is not made invincible. Heavy tools prevent jumping and climbing. Optional character poses work with platformer animation. Zero time stops the tool.

### sprites: isUsingTool

True only while this character's timed held-tool swing is active. Use this in hit events to award points or choose an effect.

### sprites: startMeleeAttack

Attack in the direction the character faces. Use a weapon sprite that you created first. Reach is the distance between their centers in pixels. The weapon follows the character and can hit only during the swing. Movement pauses until the rest time ends. Another attack is ignored while the character is busy.

### sprites: isAttacking

True from the start of an attack until its rest time ends. Use this to keep the attack picture showing instead of a walking picture.

### sprites: patrol

Move a sprite back and forth between two points. Places it at the first point and replaces its previous Labs movement mode.

### sprites: follow

Follow a target at the chosen speed and stop within the chosen distance. Replaces this sprite's previous Labs movement mode.

### sprites: rollDownPlatforms

Roll downhill along painted platforms of this kind, drop at an edge and roll back along the next slope. Optional ladder sprites allow random downward routes. Speed is pixels per second; chance is a percent per ladder crossing.

### sprites: explorePlatforms

Walk back and forth on painted platforms, turning around at edges. At each ladder crossing, this percent chance decides whether to climb up or down. Complete ladder sprites join levels; no path or coordinate list is needed.

### scene: hudText

Show text at a fixed spot on the screen, even when the camera moves. Use the same x and y to change it. Use empty text to hide it.

### info: showBuiltinHud

Choose which built-in counters appear on screen. Their values and events still work when hidden, so you can draw your own scoreboard with HUD or text blocks.

### Inventory: create

Make an empty bag. Slots count different item names, not individual copies: five coins use one slot. Each bag keeps its own items.

### Inventory: add

Try to add this many copies of an item. True means it all fits. False means the bag is full or the amount is invalid, and nothing changes. Matching names stack together; use a different name for a different item.

### Inventory: remove

Remove this many copies only if the bag has enough. True means they were removed; false leaves the bag unchanged. Removing the last copy frees its slot.

### Inventory: count

Get how many copies of this item are in the bag. An item that is not in the bag has zero copies.

### Inventory: itemNames

Get the names of the items currently in this bag. Changing this list does not change the bag.

### Inventory: emptySlots

Get the number of slots available for new item names. Items already in the bag can still stack when this reaches zero.

### Inventory: clear

Remove every item from this bag. Other bags are not changed.

### sprites: setFacing

Logical direction, independent of sprite artwork and current velocity. / enum LabsFacing { //% block="up" Up, //% block="down" Down, //% block="left" Left, //% block="right" Right } enum LabsAnchor { //% block="center" Center, //% block="front" Front, //% block="back" Back, //% block="top" Top, //% block="bottom" Bottom, //% block="left" Left, //% block="right" Right } / Configurable recipes supplied by Labs. Students' Functions remain their own. / //% color="#1BA8E0" weight=95 icon="\uf0ad" //% groups='["Movement", "Combat", "Enemies", "Camera", "UI"]' namespace labs { class Actor { sprite: Sprite; facing: LabsFacing = LabsFacing.Right; hasFirePoint: boolean = false; fireX: number = 0; fireY: number = 0; fireFacing: LabsFacing = LabsFacing.Right; mode: number = 0; sx: number = 100; sy: number = 100; x1: number; y1: number; x2: number; y2: number; toEnd: boolean = true; target: Sprite; speed: number; stopDistance: number; health: number = 0; maximum: number = 0; invulnerableUntil: number = 0; knockbackUntil: number = 0; kx: number = 0; ky: number = 0; previousVX: number = 0; previousVY: number = 0; // PXT requires an explicit constructor when a class has initialized fields. constructor() { } } function actor(sprite: Sprite): Actor { let state: Actor = sprite.data["__fullSailLabsRecipes_v1"]; if (!state) { state = new Actor(); state.sprite = sprite; sprite.data["__fullSailLabsRecipes_v1"] = state; } return state; } function manage(sprite: Sprite): Actor { const state = actor(sprite); const scene = game.currentScene(); let actors: Actor[] = scene.data["__fullSailLabsManaged_v1"]; if (!actors) { actors = []; scene.data["__fullSailLabsManaged_v1"] = actors; game.onUpdate(() => { for (let i = actors.length - 1; i >= 0; i--) { const a = actors[i]; if (a.sprite.flags & sprites.Flag.Destroyed) { actors.removeAt(i); continue; } update(a); } }); } if (actors.indexOf(state) < 0) actors.push(state); return state; } function aim(a: Actor, dx: number, dy: number) { if (Math.abs(dx) >= Math.abs(dy) && dx != 0) a.facing = dx > 0 ? LabsFacing.Right : LabsFacing.Left; else if (dy != 0) a.facing = dy > 0 ? LabsFacing.Down : LabsFacing.Up; } function update(a: Actor) { const s = a.sprite; if (a.knockbackUntil > game.runtime()) { s.vx = a.kx; s.vy = a.ky; return; } if (a.knockbackUntil) { a.knockbackUntil = 0; s.vx = a.previousVX; s.vy = a.previousVY; } if (a.mode == 1) { const dx = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0); const dy = (controller.down.isPressed() ? 1 : 0) - (controller.up.isPressed() ? 1 : 0); s.vx = dx a.sx; s.vy = dy a.sy; aim(a, dx, dy); } else if (a.mode == 2 || a.mode == 3) { if (a.mode == 3 && (!a.target || a.target.flags & sprites.Flag.Destroyed)) { s.vx = 0; s.vy = 0; return; } const x = a.mode == 2 ? (a.toEnd ? a.x2 : a.x1) : a.target.x; const y = a.mode == 2 ? (a.toEnd ? a.y2 : a.y1) : a.target.y; const dx = x - s.x; const dy = y - s.y; const distance = Math.sqrt(dx dx + dy dy); const step = a.speed game.currentScene().eventContext.deltaTimeMillis / 1000; if (a.mode == 3 && distance <= a.stopDistance) { s.vx = 0; s.vy = 0; } else if (a.mode == 2 && distance <= Math.max(1, step)) { s.setPosition(x, y); a.toEnd = !a.toEnd; s.vx = 0; s.vy = 0; } else if (distance > 0) { s.vx = dx / distance a.speed; s.vy = dy / distance a.speed; aim(a, dx, dy); } } } / Set a sprite's logical direction without changing its image or velocity.

### sprites: facing

Read the last logical direction of this sprite, including while it is stopped.

### controller: moveWithFacing

Move using directional controls. Horizontal facing wins diagonal ties; facing remains when stopped.

### controller: moveFourDirections

Cardinal-only movement. The last newly pressed axis wins; diagonal input never moves diagonally and facing persists at rest.

### controller: moveOnGrid

Move with the arrow buttons, one direction at a time. Turns wait for a path line, so the sprite stays lined up with narrow passages. Speed is pixels per second. The optional x and y move the path lines.

### sprites: isFacing (compatibility only)

True when the character is looking in this direction, even while standing still.

### sprites: standOnPlatformsOfKind

Land on the painted tops of every platform of this kind, including platforms created later. Slopes and moving platforms work; jumping up through them is allowed.

### scene: climbSpriteLadders

Up and down climb the rectangles of ladder sprites of this kind. The character lines up with the ladder and steps onto the platform at either end. Gaps between separate ladder pieces cannot be climbed.

### sprites: isClimbing

True while the character is holding or moving on a ladder. Use it to show a climbing picture or to prevent an action while on a ladder.

### controller: fixedArcJump

A starts a fixed arc: releasing A does not shorten it, and changing direction in the air does not steer it. Use normal horizontal controls for walking. Speed and gravity are pixels per second and pixels per second squared.

### controller: allowJumpAndClimb

Turn jumping and climbing on or off for this character. Walking still works. Turning it off while climbing lets gravity resume; useful while carrying a heavy item or using a tool.

### sprites: onJumpedOver

After this character lands from a jump, run once if it cleared obstacles of this kind. Count is the number of different obstacles passed above during that jump. Walking past them or jumping on a floor already above them does not count.

### controller: forgivingJump

A jumps with a short walk-off grace period, an early-press buffer, and release-to-short-hop. Use with normal horizontal movement.

### scene: climbLadders

Up/down climbs non-wall ladder tiles. Gravity pauses while climbing and returns on exit; horizontal controls still work.

### sprites: standOnPlatform

Jump through this platform from below and land on its painted top, including slopes. Use unrotated platform artwork; moving platforms carry the rider. Call once per platform.

### sprites: dropThroughPlatforms

Drop through these sprite platforms without changing tilemap walls or other players' collisions.

### sprites: isOnPlatform

Whether a sprite is supported by a Labs one-way platform, rather than a tilemap wall.

### sprites: setCollisionBox

Only this rectangle bumps into walls. For example, use the character's feet so its head can overlap a wall. The x and y offsets start at the image's top-left corner. The box stays the same when the image changes.

### sprites: hopTo

Hop in an arc to a chosen spot, then land there. Height is how far above the straight path the sprite rises. Walls are ignored during the hop. Another hop is ignored until the sprite lands.

### Math: randomSource

Make a separate random-number stream. The same seed repeats the same results. Other streams and Arcade's ordinary random blocks are not changed.

### Math: randomInteger

Pick a whole number between the two limits, including both limits, using this source. Keeping the seed the same lets you repeat a level or test.

### sprites: clearLineOfSight

True when a straight line between the sprites' centers crosses no wall tiles. Sprites do not block this line. Outside the tilemap counts as blocked.

### sprites: canSee

Check whether a character can see a target in front of it, within the distance and viewing angle, without a wall in the way. Facing uses the existing Labs facing blocks; 360 degrees sees in every direction.

### scene: slideToRoom

Change to another tilemap by sliding the old room away. Place the player at the new x and y. Movement pauses during the slide. Set HUD height to leave a scoreboard at the top still. Direction means the way the player is traveling.

### scene: spritesFromShapes

Each separate painted shape becomes a sprite of this kind, at its place in the picture. Transparent gaps separate shapes; touching pixels join them. The optional x and y move the whole layout. Invisible shapes can mark platforms, ladders or triggers behind background art. Returns the new sprites.
