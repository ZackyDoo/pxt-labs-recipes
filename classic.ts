/** Stateful mechanics that are not supplied by individual stock Arcade blocks. */
namespace labs {
    class ClassicActor {
        sprite: Sprite;
        platforms: Sprite[] = [];
        platformKinds: number[] = [];
        ladderKinds: number[] = [];
        activeLadder: Sprite;
        rolling: number = 0;
        rollDirection: number = 1;
        rollSupport: Sprite;
        rollLadderKind: number = -1;
        rollChance: number = 0;
        rollLadder: Sprite;
        rollLastX: number = 0;
        rollSeen: Sprite;
        rollPatrol: boolean = false;
        rollLadderDirection: number = 1;
        fixedJump: boolean = false;
        airVX: number = 0;
        jumpClimbEnabled: boolean = true;
        jumpHandlers: ((count: number) => void)[] = [];
        jumpKinds: number[] = [];
        jumped: Sprite[] = [];
        wasGrounded: boolean = false;
        jumping: boolean = false;
        jumpBottom: number = 0;
        motionFrames: Image[][];
        motionInterval: number = 100;
        motionRight: boolean = true;
        motionLast: Image;
        motionLastRight: boolean = false;
        climbFrame: number = 0;
        heldTool: Sprite;
        heldFrames: Image[];
        heldPoses: Image[];
        heldUntil: number = 0;
        heldStart: number = 0;
        heldReach: number = 16;
        heldInterval: number = 100;
        heldHeavy: boolean = false;
        heldControls: boolean = true;
        support: Sprite;
        supportX: number = 0;
        supportY: number = 0;
        previousBottom: number = 0;
        dropUntil: number = 0;
        jumpSpeed: number = 0;
        grace: number = 100;
        buffer: number = 120;
        lastGround: number = -100000;
        jumpUntil: number = -100000;
        jumpHeld: boolean = false;
        ladder: Image;
        climbSpeed: number = 50;
        climbing: boolean = false;
        savedGravity: number = 0;
        walkSpeed: number = 0;
        fourWay: boolean = false;
        axis: number = 0;
        queuedAxis: number = 0;
        lastDX: number = 0;
        lastDY: number = 0;
        turnGrid: number = 0;
        originX: number = 0;
        originY: number = 0;
        lockUntil: number = 0;
        footprint: number[];
        weapon: Sprite;
        attackStart: number = -100000;
        windup: number = 0;
        active: number = 0;
        recovery: number = 0;
        reach: number = 0;
        attackDirection: number = 0;
        hop: number[];
        hopThroughWalls: boolean = false;
        constructor() { }
    }
    function classic(sprite: Sprite): ClassicActor {
        let a: ClassicActor = sprite.data['__labsClassicActor_v1'];
        if (a) return a;
        a = new ClassicActor(); a.sprite = sprite; a.previousBottom = sprite.bottom;
        sprite.data['__labsClassicActor_v1'] = a;
        const current = game.currentScene();
        let actors: ClassicActor[] = current.data['__labsClassicActors_v1'];
        if (!actors) {
            actors = []; current.data['__labsClassicActors_v1'] = actors;
            current.eventContext.registerFrameHandler(scene.PHYSICS_PRIORITY - 1, () => {
                for (let i = actors.length - 1; i >= 0; i--) {
                    if (actors[i].sprite.flags & sprites.Flag.Destroyed) {
                        finishTool(actors[i]);
                        if (actors[i].weapon) {
                            actors[i].weapon.setFlag(SpriteFlag.Invisible, true);
                            actors[i].weapon.setFlag(SpriteFlag.GhostThroughSprites, true);
                        }
                        actors.removeAt(i);
                    }
                    else beforePhysics(actors[i]);
                }
            });
            current.eventContext.registerFrameHandler(scene.PHYSICS_PRIORITY + 1, () => {
                for (let i = 0; i < actors.length; i++) afterPhysics(actors[i]);
            });
        }
        actors.push(a); return a;
    }
    function beforePhysics(a: ClassicActor) {
        const s = a.sprite, now = game.runtime();
        if (a.heldTool && (now >= a.heldUntil || a.heldTool.flags & sprites.Flag.Destroyed)) finishTool(a);
        for (let kind of a.platformKinds) for (let platform of sprites.allOfKind(kind)) {
            if (platform != s && a.platforms.indexOf(platform) < 0) a.platforms.push(platform);
        }
        const dx = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0);
        const dy = (controller.down.isPressed() ? 1 : 0) - (controller.up.isPressed() ? 1 : 0);
        const jump = controller.A.isPressed();
        const push = s.data['__fullSailLabsRecipes_v1'];
        const pushed = push && now < push.knockbackUntil;
        if (a.fourWay && !pushed) {
            let requested = a.queuedAxis || a.axis;
            if (dx && !a.lastDX) requested = 1;
            if (dy && !a.lastDY) requested = 2;
            if (!dx && dy) requested = 2;
            if (!dy && dx) requested = 1;
            if (!dx && !dy) requested = a.axis;
            a.queuedAxis = requested;
            if (a.axis && a.turnGrid > 0 && requested != a.axis) {
                const coordinate = a.axis == 1 ? s.x - a.originX : s.y - a.originY;
                const positive = labs.facing(s) == LabsFacing.Right || labs.facing(s) == LabsFacing.Down;
                let snapped = (positive ? Math.ceil(coordinate / a.turnGrid) : Math.floor(coordinate / a.turnGrid)) * a.turnGrid;
                const tolerance = Math.max(1, a.walkSpeed * game.currentScene().eventContext.deltaTimeMillis / 1000);
                const blocked = a.axis == 1 ? s.isHittingTile(CollisionDirection.Left) || s.isHittingTile(CollisionDirection.Right) : s.isHittingTile(CollisionDirection.Top) || s.isHittingTile(CollisionDirection.Bottom);
                if (blocked) {
                    // A shove or a teleport can leave the feet between lanes at a wall.
                    // Back up to the last lane instead of pushing into the wall forever.
                    snapped = (positive ? Math.floor(coordinate / a.turnGrid) : Math.ceil(coordinate / a.turnGrid)) * a.turnGrid;
                }
                if (blocked || Math.abs(coordinate - snapped) <= tolerance) {
                    if (a.axis == 1) s.x = snapped + a.originX;
                    else s.y = snapped + a.originY;
                    a.axis = requested;
                }
            } else a.axis = requested;
            s.vx = a.axis == 1 ? dx * a.walkSpeed : 0;
            s.vy = a.axis == 2 ? dy * a.walkSpeed : 0;
            // Continue to the next lane when a turn is queued between grid lines.
            if (a.turnGrid > 0 && requested != a.axis) {
                if (a.axis == 1) s.vx = (labs.facing(s) == LabsFacing.Left ? -1 : 1) * a.walkSpeed;
                else s.vy = (labs.facing(s) == LabsFacing.Up ? -1 : 1) * a.walkSpeed;
            }
            if (now < a.lockUntil) { s.vx = 0; s.vy = 0; }
            if (s.vx) labs.setFacing(s, s.vx > 0 ? LabsFacing.Right : LabsFacing.Left);
            else if (s.vy) labs.setFacing(s, s.vy > 0 ? LabsFacing.Down : LabsFacing.Up);
            a.lastDX = dx; a.lastDY = dy;
        }
        if (pushed) {
            s.vx = push.kx; s.vy = push.ky;
            a.attackStart = -100000;
            a.lockUntil = now;
        }
        if (a.footprint) {
            const f = a.footprint;
            if (!s._hitbox || !s._hitbox.isValid() || s._hitbox.width != Fx8(f[0]) || s._hitbox.height != Fx8(f[1]) || s._hitbox.ox != Fx8(f[2]) || s._hitbox.oy != Fx8(f[3]))
                s._hitbox = new game.Hitbox(s, Fx8(f[0]), Fx8(f[1]), Fx8(f[2]), Fx8(f[3]));
        }
        if (a.hop) {
            const h = a.hop, t = Math.min(1, Math.max(0, (now - h[0]) / h[1]));
            s.vx = 0; s.vy = 0;
            s.setPosition(h[2] + (h[4] - h[2]) * t, h[3] + (h[5] - h[3]) * t - h[6] * 4 * t * (1 - t));
            if (t >= 1) { a.hop = null; s.setFlag(SpriteFlag.GhostThroughWalls, a.hopThroughWalls); }
        }
        if (a.weapon && !(a.weapon.flags & sprites.Flag.Destroyed)) {
            const elapsed = now - a.attackStart;
            const visible = elapsed >= a.windup && elapsed < a.windup + a.active;
            a.weapon.setFlag(SpriteFlag.Invisible, !visible);
            a.weapon.setFlag(SpriteFlag.GhostThroughSprites, !visible);
            const direction = a.attackDirection;
            a.weapon.setPosition(s.x + (direction == LabsFacing.Right ? a.reach : direction == LabsFacing.Left ? -a.reach : 0), s.y + (direction == LabsFacing.Down ? a.reach : direction == LabsFacing.Up ? -a.reach : 0));
        }
        let onLadder = false;
        if (a.ladder && game.currentScene().tileMap && game.currentScene().tileMap.data) {
            // TileDirection.Bottom checks a whole neighboring tile, not the feet.
            // That kept gravity paused even after a climber had cleared a ladder.
            const size = 1 << game.currentScene().tileMap.scale;
            const feet = tiles.getTileLocation(Math.floor(s.x / size), Math.floor((s.bottom - 1) / size));
            onLadder = s.tileKindAt(TileDirection.Center, a.ladder) || tiles.tileAtLocationEquals(feet, a.ladder);
        }
        let ladder: Sprite = null;
        if (a.jumpClimbEnabled && !a.rolling) for (let kind of a.ladderKinds) for (let candidate of sprites.allOfKind(kind)) {
            if (Math.abs(s.x - candidate.x) <= Math.max(4, candidate.width / 2) && s.vy >= 0 || a.climbing) {
                const feet = s.bottom;
                if (Math.abs(s.x - candidate.x) <= Math.max(4, candidate.width / 2) &&
                    ((dy < 0 && feet > candidate.top + (a.climbing ? 0 : 0.5) && feet <= candidate.bottom + 3) ||
                     (dy > 0 && feet >= candidate.top - 2 && feet < candidate.bottom - (a.climbing ? 0 : 0.5)) ||
                     (!dy && a.activeLadder == candidate && feet > candidate.top && feet < candidate.bottom))) ladder = candidate;
            }
        }
        a.activeLadder = ladder;
        onLadder = onLadder || !!ladder;
        if (a.jumpClimbEnabled && (a.ladder || ladder) && onLadder && (dy || a.climbing) && (!jump || a.fixedJump)) {
            if (!a.climbing) a.savedGravity = s.ay;
            a.climbing = true; s.ay = 0; s.vy = dy * a.climbSpeed; a.support = null;
            if (ladder) { s.x = ladder.x; s.vx = 0; }
        } else if (a.climbing) {
            a.climbing = false; s.ay = a.savedGravity;
        }
        if (a.jumpSpeed > 0 && a.jumpClimbEnabled) {
            if (jump && !a.jumpHeld) a.jumpUntil = now + a.buffer;
            if (a.jumpUntil >= now && (a.support || s.isHittingTile(CollisionDirection.Bottom) || now - a.lastGround <= a.grace || (!a.fixedJump && onLadder))) {
                s.vy = -a.jumpSpeed; a.support = null; a.lastGround = -100000; a.jumpUntil = -100000;
                a.airVX = s.vx;
                a.jumpBottom = s.bottom;
                a.jumping = true;
                a.jumped = [];
            }
            // Releasing A shortens a jump; holding A preserves the full jump.
            if (!a.fixedJump && !jump && a.jumpHeld && s.vy < 0) s.vy *= 0.5;
        }
        if (a.fixedJump && a.jumping) s.vx = a.airVX;
        if (a.rolling) updateRolling(a);
        a.jumpHeld = jump;
        a.previousBottom = s.bottom;
    }
    function surfaceY(platform: Sprite, x: number): number {
        if (x < platform.left || x >= platform.right || !platform.width || !platform.height) return -100000;
        const column = Math.min(platform.image.width - 1, Math.max(0, Math.floor((x - platform.left) * platform.image.width / platform.width)));
        for (let y = 0; y < platform.image.height; y++) {
            if (platform.image.getPixel(column, y)) return platform.top + y * platform.height / platform.image.height;
        }
        return -100000;
    }
    function afterPhysics(a: ClassicActor) {
        const s = a.sprite, now = game.runtime();
        if (a.activeLadder && a.climbing && (s.bottom <= a.activeLadder.top || s.bottom >= a.activeLadder.bottom)) {
            s.bottom = s.bottom <= a.activeLadder.top ? a.activeLadder.top : a.activeLadder.bottom;
            a.previousBottom = s.bottom;
            a.climbing = false; s.ay = a.savedGravity; s.vy = 0; a.activeLadder = null;
        }
        let support: Sprite = null, top = 100000;
        if (a.support && !(a.support.flags & sprites.Flag.Destroyed) && s.vy >= 0 && now >= a.dropUntil) {
            s.x += a.support.x - a.supportX;
        }
        for (let i = a.platforms.length - 1; i >= 0; i--) {
            const p = a.platforms[i];
            if (p.flags & sprites.Flag.Destroyed) { a.platforms.removeAt(i); continue; }
            if (s.vy < 0 || now < a.dropUntil || p.rotation != 0 || a.climbing) continue;
            // Sample both feet. Painted slopes and transparent gaps become real surfaces.
            const inset = Math.min(2, s.width / 4);
            const left = surfaceY(p, s.left + inset), right = surfaceY(p, s.right - inset - 0.1);
            let y = left == -100000 ? right : right == -100000 ? left : Math.min(left, right);
            if (y == -100000) continue;
            const carried = a.support == p && Math.abs(s.bottom - y) <= Math.max(8, Math.abs(p.y - a.supportY) + Math.abs(s.vx) * game.currentScene().eventContext.deltaTimeMillis / 1000 + 2);
            const crossed = a.previousBottom <= y + 1 && s.bottom >= y;
            if ((carried || crossed) && y < top) { top = y; support = p; }
        }
        a.support = support;
        if (support) {
            s.bottom = top; s.vy = 0; a.supportX = support.x; a.supportY = support.y;
        }
        if (!a.climbing && s.vy >= 0 && (support || s.isHittingTile(CollisionDirection.Bottom))) a.lastGround = now;
        if (a.jumping) for (let kind of a.jumpKinds) for (let obstacle of sprites.allOfKind(kind)) {
            if (obstacle != s && a.jumpBottom > obstacle.top + 2 && Math.abs(s.x - obstacle.x) <= (s.width + obstacle.width) / 2 && s.bottom <= obstacle.top + 2 && s.bottom >= obstacle.top - 32 && a.jumped.indexOf(obstacle) < 0) a.jumped.push(obstacle);
        }
        const grounded = !!support || s.isHittingTile(CollisionDirection.Bottom);
        if (grounded && s.vy >= 0 && a.jumping) {
            a.jumping = false;
            if (a.jumped.length) for (let i = 0; i < a.jumpHandlers.length; i++) {
                const handler = a.jumpHandlers[i];
                let count = 0;
                for (let obstacle of a.jumped) if (obstacle.kind() == a.jumpKinds[i]) count++;
                if (count) control.runInParallel(() => handler(count));
            }
            a.jumped = [];
        }
        a.wasGrounded = grounded;
        animatePlatformActor(a);
    }

    function finishTool(a: ClassicActor) {
        if (!a.heldTool) return;
        a.heldTool.setFlag(SpriteFlag.Invisible, true); a.heldTool.setFlag(SpriteFlag.GhostThroughSprites, true);
        if (a.heldHeavy) a.jumpClimbEnabled = a.heldControls;
        a.heldTool = null; a.heldUntil = 0;
    }
    function animatePlatformActor(a: ClassicActor) {
        const s = a.sprite, now = game.runtime();
        if (s.vx) a.motionRight = s.vx > 0;
        const phase = Math.floor((now - a.heldStart) / a.heldInterval);
        if (a.heldTool) {
            const sideways = phase % 2 != 0;
            a.heldTool.setImage(a.heldFrames[phase % a.heldFrames.length].clone());
            if (a.motionRight && sideways) a.heldTool.image.flipX();
            a.heldTool.setPosition(s.x + (sideways ? (a.motionRight ? a.heldReach : -a.heldReach) : 0), s.y - (sideways ? 0 : a.heldReach));
        }
        if (!a.motionFrames) return;
        let frames = a.motionFrames[0], mirror = a.motionRight;
        let frame = Math.floor(now / a.motionInterval);
        if (a.heldTool && a.heldPoses && a.heldPoses.length) { frames = a.heldPoses; frame = phase; }
        else if (a.climbing) {
            frames = a.motionFrames[3]; mirror = false;
            if (s.vy) a.climbFrame += game.currentScene().eventContext.deltaTimeMillis;
            frame = Math.floor(a.climbFrame / a.motionInterval);
        }
        else if (!a.support && !s.isHittingTile(CollisionDirection.Bottom)) frames = a.motionFrames[2];
        else if (s.vx) frames = a.motionFrames[1];
        if (!frames || !frames.length) return;
        const picture = frames[frame % frames.length];
        if (picture != a.motionLast || mirror != a.motionLastRight) {
            s.setImage(picture.clone()); if (mirror) s.image.flipX();
            a.motionLast = picture; a.motionLastRight = mirror;
        }
    }

    /** Choose pictures automatically from platform contact and ladder state: standing, walking, airborne, or climbing. Draw the character facing left; it mirrors when moving right and keeps facing at rest. A paused climber stops animating. */
    //% blockId=labs_platform_animations block="animate $sprite standing $idle walking $walk airborne $air climbing $climb || every $interval ms" blockNamespace=animation color="#00b894" group="Character"
    //% sprite.shadow=variables_get sprite.defl=mySprite idle.shadow=animation_editor walk.shadow=animation_editor air.shadow=animation_editor climb.shadow=animation_editor interval.defl=100 expandableArgumentMode="toggle"
    export function animatePlatformer(sprite: Sprite, idle: Image[], walk: Image[], air: Image[], climb: Image[], interval: number = 100) {
        const a = classic(sprite); a.motionFrames = [idle, walk, air, climb]; a.motionInterval = Math.max(1, interval); a.motionLast = null;
    }

    /** Repeatedly swing a tool above and in front of this character for a set time. Frames alternate between raised and lowered pictures. Only the tool's real sprite can hit enemies; the character is not made invincible. Heavy tools prevent jumping and climbing. Optional character poses work with platformer animation. Zero time stops the tool. */
    //% blockId=labs_held_tool block="let $sprite swing $tool frames $frames for $milliseconds ms || reach $reach swing every $interval ms heavy $heavy character poses $poses" blockNamespace=sprites color="#4B7BEC" group="Combat"
    //% sprite.shadow=variables_get sprite.defl=mySprite tool.shadow=variables_get tool.defl=tool frames.shadow=animation_editor poses.shadow=animation_editor milliseconds.defl=10000 reach.defl=16 interval.defl=100 heavy.shadow=toggleOnOff heavy.defl=true expandableArgumentMode="toggle"
    export function swingHeldTool(sprite: Sprite, tool: Sprite, frames: Image[], milliseconds: number, reach: number = 16, interval: number = 100, heavy: boolean = true, poses: Image[] = null) {
        const a = classic(sprite); finishTool(a);
        if (sprite == tool || !tool || !frames || !frames.length || milliseconds <= 0) return;
        // Expanding the optional editor input can supply a blank default frame.
        // Treat that as no pose override, rather than making the owner disappear.
        let paintedPose = false;
        if (poses) for (let pose of poses) if (pose) for (let y = 0; y < pose.height; y++) for (let x = 0; x < pose.width; x++) if (pose.getPixel(x, y)) paintedPose = true;
        a.heldTool = tool; a.heldFrames = frames; a.heldPoses = paintedPose ? poses : null; a.heldStart = game.runtime(); a.heldUntil = a.heldStart + milliseconds;
        a.heldReach = Math.max(0, reach); a.heldInterval = Math.max(1, interval); a.heldHeavy = heavy; a.heldControls = a.jumpClimbEnabled;
        if (heavy) allowJumpAndClimb(sprite, false);
        tool.setFlag(SpriteFlag.Invisible, false); tool.setFlag(SpriteFlag.GhostThroughSprites, false);
    }

    /** True only while this character's timed held-tool swing is active. Use this in hit events to award points or choose an effect. */
    //% blockId=labs_using_tool block="$sprite is swinging a held tool" blockNamespace=sprites color="#4B7BEC" group="Combat"
    //% sprite.shadow=variables_get sprite.defl=mySprite
    export function isUsingTool(sprite: Sprite): boolean { const a = classic(sprite); return !!a.heldTool && game.runtime() < a.heldUntil; }

    function updateRolling(a: ClassicActor) {
        const s = a.sprite, p = a.support;
        if (a.rollLadder) {
            const target = a.rollLadderDirection > 0 ? a.rollLadder.bottom : a.rollLadder.top;
            if (a.rollLadderDirection > 0 ? s.bottom < target : s.bottom > target) {
                a.climbing = true;
                s.x = a.rollLadder.x; s.vx = 0; s.vy = a.rolling * a.rollLadderDirection; s.ay = 0; a.dropUntil = game.runtime() + 50;
                a.rollLastX = s.x; return;
            }
            s.bottom = target; a.previousBottom = target; s.vy = 0;
            a.rollLadder = null; a.climbing = false; s.ay = 350; a.dropUntil = 0;
        }
        if (p) {
            if (p != a.rollSupport) {
                const left = surfaceY(p, p.left + 2), right = surfaceY(p, p.right - 3);
                a.rollDirection = a.rollPatrol ? (randint(0, 1) ? 1 : -1) : left != right ? (right > left ? 1 : -1) : -a.rollDirection;
                // Keep the last ladder marked until another crossing or an
                // edge turn. Arriving at its other end is not a new decision.
                a.rollSupport = p;
            }
            s.vx = a.rolling * a.rollDirection;
            if (a.rollLadderKind >= 0) for (let ladder of sprites.allOfKind(a.rollLadderKind)) {
                const downward = Math.abs(ladder.top - s.bottom) <= 4 && ladder.bottom > s.bottom + 8;
                const upward = a.rollPatrol && Math.abs(ladder.bottom - s.bottom) <= 4 && ladder.top < s.bottom - 8;
                if (ladder != a.rollSeen && (downward || upward) &&
                    (s.x - ladder.x) * (a.rollLastX - ladder.x) <= 0 && Math.abs(s.x - a.rollLastX) < 8) {
                    a.rollSeen = ladder;
                    if (randint(1, 100) <= a.rollChance) { a.rollLadder = ladder; a.rollLadderDirection = downward ? 1 : -1; s.x = ladder.x; s.vx = 0; a.dropUntil = game.runtime() + 50; a.support = null; }
                }
            }
            if (!a.rollLadder && (a.rollDirection > 0 ? s.x >= p.right - 3 : s.x <= p.left + 3)) {
                if (a.rollPatrol) { a.rollDirection = -a.rollDirection; s.vx = a.rolling * a.rollDirection; a.rollSeen = null; }
                else { a.dropUntil = game.runtime() + 180; a.support = null; s.vx = 0; s.vy = Math.max(30, s.vy); }
            }
        } else if (!a.rollLadder) s.vx = 0;
        a.rollLastX = s.x;
    }

    /** Land on the painted tops of every platform of this kind, including platforms created later. Slopes and moving platforms work; jumping up through them is allowed. */
    //% blockId=labs_platform_kind block="let $sprite stand on platforms of kind $kind" weight=44 blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite kind.shadow=spritekind
    export function standOnPlatformsOfKind(sprite: Sprite, kind: number) {
        const a = classic(sprite); if (a.platformKinds.indexOf(kind) < 0) a.platformKinds.push(kind);
    }

    /** Up and down climb the rectangles of ladder sprites of this kind. The character lines up with the ladder and steps onto the platform at either end. Gaps between separate ladder pieces cannot be climbed. */
    //% blockId=labs_sprite_ladders block="let $sprite climb ladders of kind $kind at speed $speed" weight=49 blockNamespace=scene color="#4b6584" group="Tilemaps"
    //% sprite.shadow=variables_get sprite.defl=mySprite kind.shadow=spritekind speed.defl=40
    export function climbSpriteLadders(sprite: Sprite, kind: number, speed: number) {
        const a = classic(sprite); if (a.ladderKinds.indexOf(kind) < 0) a.ladderKinds.push(kind); a.climbSpeed = Math.max(1, speed);
    }

    /** True while the character is holding or moving on a ladder. Use it to show a climbing picture or to prevent an action while on a ladder. */
    //% blockId=labs_is_climbing block="$sprite is climbing a ladder" blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite
    export function isClimbing(sprite: Sprite): boolean { return classic(sprite).climbing; }

    /** Roll downhill along painted platforms of this kind, drop at an edge and roll back along the next slope. Optional ladder sprites allow random downward routes. Speed is pixels per second; chance is a percent per ladder crossing. */
    //% blockId=labs_roll_platforms block="roll $sprite down platforms of kind $kind at speed $speed || down ladders of kind $ladderKind chance $chance percent" blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite kind.shadow=spritekind ladderKind.shadow=spritekind speed.defl=45 chance.defl=25 chance.min=0 chance.max=100 expandableArgumentMode="toggle" inlineInputMode=inline
    export function rollDownPlatforms(sprite: Sprite, kind: number, speed: number, ladderKind: number = 2147483647, chance: number = 0) {
        standOnPlatformsOfKind(sprite, kind);
        const a = classic(sprite); a.rolling = Math.max(1, Math.abs(speed)); a.rollDirection = speed < 0 ? -1 : 1;
        a.rollPatrol = false; a.rollSupport = null; a.rollSeen = null; a.rollLadder = null; a.climbing = false;
        a.rollLastX = sprite.x; a.rollLadderKind = ladderKind == 2147483647 ? -1 : ladderKind; a.rollChance = Math.constrain(chance, 0, 100); sprite.ay = 350;
    }

    /** Walk back and forth on painted platforms, turning around at edges. At each ladder crossing, this percent chance decides whether to climb up or down. Complete ladder sprites join levels; no path or coordinate list is needed. */
    //% blockId=labs_platform_wander block="let $sprite explore platforms of kind $kind using ladders of kind $ladderKind at speed $speed || ladder chance $chance percent" blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite kind.shadow=spritekind ladderKind.shadow=spritekind speed.defl=25 chance.defl=35 chance.min=0 chance.max=100 expandableArgumentMode="toggle"
    export function explorePlatforms(sprite: Sprite, kind: number, ladderKind: number, speed: number, chance: number = 35) {
        rollDownPlatforms(sprite, kind, speed, ladderKind, chance); classic(sprite).rollPatrol = true;
    }

    /** A starts a fixed arc: releasing A does not shorten it, and changing direction in the air does not steer it. Use normal horizontal controls for walking. Speed and gravity are pixels per second and pixels per second squared. */
    //% blockId=labs_fixed_jump block="give $sprite fixed jump speed $speed gravity $gravity" blockNamespace=controller color="#D54322" group="Single Player"
    //% sprite.shadow=variables_get sprite.defl=mySprite speed.defl=150 gravity.defl=600
    export function fixedArcJump(sprite: Sprite, speed: number, gravity: number) {
        forgivingJump(sprite, speed, gravity, 0, 0); classic(sprite).fixedJump = true;
    }

    /** Turn jumping and climbing on or off for this character. Walking still works. Turning it off while climbing lets gravity resume; useful while carrying a heavy item or using a tool. */
    //% blockId=labs_jump_climb_enabled block="allow $sprite to jump and climb $enabled" blockNamespace=controller color="#D54322" group="Single Player"
    //% sprite.shadow=variables_get sprite.defl=mySprite enabled.shadow=toggleOnOff
    export function allowJumpAndClimb(sprite: Sprite, enabled: boolean) {
        const a = classic(sprite); a.jumpClimbEnabled = enabled;
        if (!enabled && a.climbing) { a.climbing = false; sprite.ay = a.savedGravity; sprite.vy = 0; a.activeLadder = null; }
    }

    /** After this character lands from a jump, run once if it cleared obstacles of this kind. Count is the number of different obstacles passed above during that jump. Walking past them or jumping on a floor already above them does not count. */
    //% blockId=labs_jump_over_event block="when $sprite jumps over kind $kind $count" handlerStatement=1 draggableParameters=reporter blockNamespace=sprites color="#4B7BEC" group="Events"
    //% sprite.shadow=variables_get sprite.defl=mySprite kind.shadow=spritekind
    export function onJumpedOver(sprite: Sprite, kind: number, handler: (count: number) => void) {
        const a = classic(sprite); a.jumpKinds.push(kind); a.jumpHandlers.push(handler);
    }
    /** A jumps with a short walk-off grace period, an early-press buffer, and release-to-short-hop. Use with normal horizontal movement. */
    //% blockId=labs_forgiving_jump block="give $sprite jump speed $speed gravity $gravity || walk-off grace $grace ms early-press buffer $buffer ms" weight=85 blockNamespace=controller color="#D54322" group="Single Player"
    //% sprite.shadow=variables_get sprite.defl=mySprite speed.defl=150 gravity.defl=350 grace.defl=100 buffer.defl=120
    //% expandableArgumentMode="toggle" inlineInputMode=inline
    export function forgivingJump(sprite: Sprite, speed: number, gravity: number, grace: number = 100, buffer: number = 120) {
        const a = classic(sprite); a.jumpSpeed = Math.max(0, speed); a.grace = Math.max(0, grace); a.buffer = Math.max(0, buffer);
        a.fixedJump = false;
        if (a.climbing) a.savedGravity = Math.max(0, gravity); else sprite.ay = Math.max(0, gravity);
    }
    /** Up/down climbs non-wall ladder tiles. Gravity pauses while climbing and returns on exit; horizontal controls still work. */
    //% blockId=labs_climb_ladders block="let $sprite climb $tile tiles at speed $speed" weight=50 blockNamespace=scene color="#4b6584" group="Tilemaps"
    //% sprite.shadow=variables_get sprite.defl=mySprite tile.shadow=tileset_tile_picker speed.defl=50
    export function climbLadders(sprite: Sprite, tile: Image, speed: number) {
        const a = classic(sprite); a.ladder = tile; a.climbSpeed = Math.max(0, speed);
    }
    /** Jump through this platform from below and land on its painted top, including slopes. Use unrotated platform artwork; moving platforms carry the rider. Call once per platform. */
    //% blockId=labs_one_way_platform block="let $sprite stand on $platform from above" weight=45 blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite platform.shadow=variables_get platform.defl=platform
    export function standOnPlatform(sprite: Sprite, platform: Sprite) {
        if (sprite == platform) return;
        const a = classic(sprite); if (a.platforms.indexOf(platform) < 0) a.platforms.push(platform);
    }
    /** Drop through these sprite platforms without changing tilemap walls or other players' collisions. */
    //% blockId=labs_drop_through block="drop $sprite through platforms for $milliseconds ms" weight=44 blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite milliseconds.defl=250
    export function dropThroughPlatforms(sprite: Sprite, milliseconds: number) {
        const a = classic(sprite); a.dropUntil = game.runtime() + Math.max(1, milliseconds); a.support = null; a.lastGround = -100000;
        sprite.vy = Math.max(30, sprite.vy);
    }
    /** Whether a sprite is supported by a Labs one-way platform, rather than a tilemap wall. */
    //% blockId=labs_on_platform block="$sprite is standing on a platform" weight=43 blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite
    export function isOnPlatform(sprite: Sprite): boolean { return !!classic(sprite).support; }
    /** Cardinal-only movement. The last newly pressed axis wins; diagonal input never moves diagonally and facing persists at rest. */
    //% blockId=labs_adventure_move block="move $sprite in four directions at speed $speed" weight=84 blockNamespace=controller color="#D54322" group="Single Player"
    //% sprite.shadow=variables_get sprite.defl=mySprite speed.defl=80
    export function moveFourDirections(sprite: Sprite, speed: number) {
        const a = classic(sprite); a.fourWay = true; a.walkSpeed = Math.max(0, speed);
        a.turnGrid = 0;
        controller.moveSprite(sprite, 0, 0);
    }
    /** Move with the arrow buttons, one direction at a time. Turns wait for a path line, so the sprite stays lined up with narrow passages. Speed is pixels per second. The optional x and y move the path lines. */
    //% blockId=labs_grid_move block="move $sprite along $grid pixel lanes at speed $speed || lane origin x $originX y $originY" weight=83 blockNamespace=controller color="#D54322" group="Single Player"
    //% sprite.shadow=variables_get sprite.defl=mySprite grid.defl=8 speed.defl=80 originX.defl=0 originY.defl=0
    //% expandableArgumentMode="toggle" inlineInputMode=inline
    export function moveOnGrid(sprite: Sprite, grid: number, speed: number, originX: number = 0, originY: number = 0) {
        moveFourDirections(sprite, speed);
        const a = classic(sprite); a.turnGrid = Math.max(1, grid); a.originX = originX; a.originY = originY;
    }
    /** Only this rectangle bumps into walls. For example, use the character's feet so its head can overlap a wall. The x and y offsets start at the image's top-left corner. The box stays the same when the image changes. */
    //% blockId=labs_footprint block="set $sprite collision box width $width height $height offset x $x y $y" weight=42 blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite width.defl=8 height.defl=8 x.defl=4 y.defl=8 inlineInputMode=inline
    export function setCollisionBox(sprite: Sprite, width: number, height: number, x: number, y: number) {
        classic(sprite).footprint = [Math.max(1, width), Math.max(1, height), x, y];
    }
    /** Attack in the direction the character faces. Use a weapon sprite that you created first. Reach is the distance between their centers in pixels. The weapon follows the character and can hit only during the swing. Movement pauses until the rest time ends. Another attack is ignored while the character is busy. */
    //% blockId=labs_melee_attack block="make $sprite attack with $weapon reach $reach || wait $windup ms swing $active ms rest $recovery ms" weight=65 blockNamespace=sprites color="#4B7BEC" group="Combat"
    //% sprite.shadow=variables_get sprite.defl=mySprite weapon.shadow=variables_get weapon.defl=weapon reach.defl=12 windup.defl=83 active.defl=133 recovery.defl=50 inlineInputMode=inline
    //% expandableArgumentMode="toggle"
    export function startMeleeAttack(sprite: Sprite, weapon: Sprite, reach: number, windup: number = 83, active: number = 133, recovery: number = 50) {
        const a = classic(sprite), now = game.runtime();
        if (sprite == weapon || now < a.lockUntil) return;
        a.weapon = weapon; a.reach = reach; a.windup = Math.max(0, windup); a.active = Math.max(1, active); a.recovery = Math.max(0, recovery);
        a.attackStart = now; a.attackDirection = labs.facing(sprite); a.lockUntil = now + a.windup + a.active + a.recovery;
        sprite.vx = 0; sprite.vy = 0;
        weapon.setFlag(SpriteFlag.GhostThroughWalls, true); weapon.setFlag(SpriteFlag.Invisible, true); weapon.setFlag(SpriteFlag.GhostThroughSprites, true);
    }
    /** True from the start of an attack until its rest time ends. Use this to keep the attack picture showing instead of a walking picture. */
    //% blockId=labs_is_attacking block="$sprite is attacking" weight=64 blockNamespace=sprites color="#4B7BEC" group="Combat"
    //% sprite.shadow=variables_get sprite.defl=mySprite
    export function isAttacking(sprite: Sprite): boolean {
        const a = classic(sprite); return game.runtime() < a.attackStart + a.windup + a.active + a.recovery;
    }
    /** True when the character is looking in this direction, even while standing still. */
    //% blockId=labs_is_facing block="$sprite is facing $direction" weight=41 blockHidden=true blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite
    export function isFacing(sprite: Sprite, direction: LabsFacing): boolean { return labs.facing(sprite) == direction; }
    /** Hop in an arc to a chosen spot, then land there. Height is how far above the straight path the sprite rises. Walls are ignored during the hop. Another hop is ignored until the sprite lands. */
    //% blockId=labs_hop_to block="make $sprite hop to x $x y $y || height $height over $milliseconds ms" weight=40 blockNamespace=sprites color="#4B7BEC" group="Physics"
    //% sprite.shadow=variables_get sprite.defl=mySprite height.defl=16 milliseconds.defl=500 expandableArgumentMode="toggle" inlineInputMode=inline
    export function hopTo(sprite: Sprite, x: number, y: number, height: number = 16, milliseconds: number = 500) {
        const a = classic(sprite);
        if (a.hop) return;
        a.hop = [game.runtime(), Math.max(1, milliseconds), sprite.x, sprite.y, x, y, Math.max(0, height)];
        a.hopThroughWalls = !!(sprite.flags & sprites.Flag.GhostThroughWalls);
        sprite.setFlag(SpriteFlag.GhostThroughWalls, true);
    }
    /** Show text at a fixed spot on the screen, even when the camera moves. Use the same x and y to change it. Use empty text to hide it. */
    //% blockId=labs_hud_text block="HUD text $text at x $x y $y color $color" weight=50 blockNamespace=scene color="#4b6584" group="HUD"
    //% color.shadow=colorindexpicker color.defl=1 x.defl=0 y.defl=0 inlineInputMode=inline
    export function hudText(text: string, x: number, y: number, color: number) {
        const current = game.currentScene();
        let labels: any[] = current.data['__labsHudText_v1'];
        if (!labels) {
            labels = []; current.data['__labsHudText_v1'] = labels;
            scene.createRenderable(200, target => {
                for (const label of labels) target.print(label.text, label.x, label.y, label.color, image.font8);
            });
        }
        for (const label of labels) if (label.x == x && label.y == y) { label.text = text; label.color = color; return; }
        labels.push({text:text,x:x,y:y,color:color});
    }
    /** Change to another tilemap by sliding the old room away. Place the player at the new x and y. Movement pauses during the slide. Set HUD height to leave a scoreboard at the top still. Direction means the way the player is traveling. */
    //% blockId=labs_slide_room block="slide $sprite to tilemap $map at x $x y $y direction $direction || duration $milliseconds ms HUD height $hudHeight" weight=49 blockNamespace=scene color="#4b6584" group="Tilemaps"
    //% sprite.shadow=variables_get sprite.defl=mySprite map.shadow=tiles_tilemap_editor x.defl=128 y.defl=149 milliseconds.defl=400 hudHeight.defl=0
    //% expandableArgumentMode="toggle" inlineInputMode=inline
    export function slideToRoom(sprite: Sprite, map: tiles.TileMapData, x: number, y: number, direction: LabsFacing, milliseconds: number = 400, hudHeight: number = 0) {
        const current = game.currentScene(), duration = Math.max(1, milliseconds), start = game.runtime();
        const generation = (current.data['__labsRoomWipe_v1'] || 0) + 1;
        current.data['__labsRoomWipe_v1'] = generation;
        const previous = screen.clone(), hud = Math.max(0, Math.min(screen.height, hudHeight));
        const a = classic(sprite); a.lockUntil = start + duration;
        sprite.vx = 0; sprite.vy = 0;
        tiles.setCurrentTilemap(map); sprite.setPosition(x, y);
        scene.cameraFollowSprite(null); scene.centerCameraAt(screen.width / 2, screen.height / 2);
        let next: Image = null;
        let wipe: scene.Renderable = null;
        wipe = scene.createRenderable(100, (target, camera) => {
            if (!next) next = target.clone();
            const elapsed = game.runtime() - start;
            if (elapsed >= duration || generation != current.data['__labsRoomWipe_v1']) {
                wipe.destroy(); wipe = null; next = null; return;
            }
            const amount = Math.min(1, elapsed / duration), w = target.width, h = target.height - hud;
            const dx = direction == LabsFacing.Left ? 1 : direction == LabsFacing.Right ? -1 : 0;
            const dy = direction == LabsFacing.Up ? 1 : direction == LabsFacing.Down ? -1 : 0;
            const ox = Math.round(dx * w * amount), oy = Math.round(dy * h * amount);
            target.fillRect(0, hud, w, h, 15);
            for (let row = hud; row < target.height; row++) for (let col = 0; col < w; col++) {
                const px = col - ox, py = row - oy;
                if (px >= 0 && px < w && py >= hud && py < target.height) target.setPixel(col, row, previous.getPixel(px, py));
                else {
                    const nx = col - ox + dx * w, ny = row - oy + dy * h;
                    if (nx >= 0 && nx < w && ny >= hud && ny < target.height) target.setPixel(col, row, next.getPixel(nx, ny));
                }
            }
        });
    }
    /** Keep the camera in one grid room until the player crosses an edge, then slide to the next room. Use instead of camera follow. */
    //% blockId=labs_room_camera block="camera follows $sprite room by room || width $width height $height slide $milliseconds ms" weight=75 blockNamespace=scene color="#4b6584" group="Camera"
    //% sprite.shadow=variables_get sprite.defl=mySprite width.defl=160 height.defl=120 milliseconds.defl=200
    //% expandableArgumentMode="toggle" inlineInputMode=inline
    export function roomCamera(sprite: Sprite, width: number = 160, height: number = 120, milliseconds: number = 200) {
        const current = game.currentScene();
        const settings = [Math.max(1, width), Math.max(1, height), Math.max(0, milliseconds)];
        // One camera manager per scene. Reconfiguring does not stack camera handlers.
        const key = '__labsRoomCamera_v1';
        if (current.data[key]) { current.data[key].sprite = sprite; current.data[key].settings = settings; return; }
        const state = {sprite:sprite,settings:settings,x:0,y:0,fromX:0,fromY:0,toX:-100000,toY:-100000,start:0};
        current.data[key] = state;
        scene.cameraFollowSprite(null);
        game.onUpdate(() => {
            if (state.sprite.flags & sprites.Flag.Destroyed) return;
            const w = state.settings[0], h = state.settings[1], duration = state.settings[2], now = game.runtime();
            const x = Math.floor(state.sprite.x / w) * w + w / 2, y = Math.floor(state.sprite.y / h) * h + h / 2;
            if (state.toX == -100000) { state.x = x; state.y = y; }
            if (x != state.toX || y != state.toY) { state.fromX = state.x; state.fromY = state.y; state.toX = x; state.toY = y; state.start = now; }
            const t = duration ? Math.min(1, (now - state.start) / duration) : 1;
            state.x = state.fromX + (state.toX - state.fromX) * t; state.y = state.fromY + (state.toY - state.fromY) * t;
            scene.centerCameraAt(state.x, state.y);
        });
    }
}
