/** Logical direction, independent of sprite artwork and current velocity. */
enum LabsFacing {
    //% block="up"
    Up,
    //% block="down"
    Down,
    //% block="left"
    Left,
    //% block="right"
    Right
}

enum LabsAnchor {
    //% block="center"
    Center,
    //% block="front"
    Front,
    //% block="back"
    Back,
    //% block="top"
    Top,
    //% block="bottom"
    Bottom,
    //% block="left"
    Left,
    //% block="right"
    Right
}

/** Configurable recipes supplied by Labs. Students' Functions remain their own. */
//% color="#1BA8E0" weight=95 icon="\uf0ad"
//% groups='["Movement", "Combat", "Enemies", "Camera", "UI"]'
namespace labs {
    class Actor {
        sprite: Sprite;
        facing: LabsFacing = LabsFacing.Right;
        hasFirePoint: boolean = false;
        fireX: number = 0;
        fireY: number = 0;
        fireFacing: LabsFacing = LabsFacing.Right;
        mode: number = 0;
        sx: number = 100;
        sy: number = 100;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        toEnd: boolean = true;
        target: Sprite;
        speed: number;
        stopDistance: number;
        health: number = 0;
        maximum: number = 0;
        invulnerableUntil: number = 0;
        knockbackUntil: number = 0;
        kx: number = 0;
        ky: number = 0;
        previousVX: number = 0;
        previousVY: number = 0;

        // PXT requires an explicit constructor when a class has initialized fields.
        constructor() { }
    }

    function actor(sprite: Sprite): Actor {
        let state: Actor = sprite.data["__fullSailLabsRecipes_v1"];
        if (!state) {
            state = new Actor();
            state.sprite = sprite;
            sprite.data["__fullSailLabsRecipes_v1"] = state;
        }
        return state;
    }

    function manage(sprite: Sprite): Actor {
        const state = actor(sprite);
        const scene = game.currentScene();
        let actors: Actor[] = scene.data["__fullSailLabsManaged_v1"];
        if (!actors) {
            actors = [];
            scene.data["__fullSailLabsManaged_v1"] = actors;
            game.onUpdate(() => {
                for (let i = actors.length - 1; i >= 0; i--) {
                    const a = actors[i];
                    if (a.sprite.flags & sprites.Flag.Destroyed) {
                        actors.removeAt(i);
                        continue;
                    }
                    update(a);
                }
            });
        }
        if (actors.indexOf(state) < 0) actors.push(state);
        return state;
    }

    function aim(a: Actor, dx: number, dy: number) {
        if (Math.abs(dx) >= Math.abs(dy) && dx != 0) a.facing = dx > 0 ? LabsFacing.Right : LabsFacing.Left;
        else if (dy != 0) a.facing = dy > 0 ? LabsFacing.Down : LabsFacing.Up;
    }

    function update(a: Actor) {
        const s = a.sprite;
        if (a.knockbackUntil > game.runtime()) {
            s.vx = a.kx;
            s.vy = a.ky;
            return;
        }
        if (a.knockbackUntil) {
            a.knockbackUntil = 0;
            s.vx = a.previousVX;
            s.vy = a.previousVY;
        }
        if (a.mode == 1) {
            const dx = (controller.right.isPressed() ? 1 : 0) - (controller.left.isPressed() ? 1 : 0);
            const dy = (controller.down.isPressed() ? 1 : 0) - (controller.up.isPressed() ? 1 : 0);
            s.vx = dx * a.sx;
            s.vy = dy * a.sy;
            aim(a, dx, dy);
        } else if (a.mode == 2 || a.mode == 3) {
            if (a.mode == 3 && (!a.target || a.target.flags & sprites.Flag.Destroyed)) {
                s.vx = 0;
                s.vy = 0;
                return;
            }
            const x = a.mode == 2 ? (a.toEnd ? a.x2 : a.x1) : a.target.x;
            const y = a.mode == 2 ? (a.toEnd ? a.y2 : a.y1) : a.target.y;
            const dx = x - s.x;
            const dy = y - s.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const step = a.speed * game.currentScene().eventContext.deltaTimeMillis / 1000;
            if (a.mode == 3 && distance <= a.stopDistance) {
                s.vx = 0; s.vy = 0;
            } else if (a.mode == 2 && distance <= Math.max(1, step)) {
                s.setPosition(x, y);
                a.toEnd = !a.toEnd;
                s.vx = 0; s.vy = 0;
            } else if (distance > 0) {
                s.vx = dx / distance * a.speed;
                s.vy = dy / distance * a.speed;
                aim(a, dx, dy);
            }
        }
    }

    /** Set a sprite's logical direction without changing its image or velocity. */
    //% blockId=labs_set_facing block="set $sprite facing $direction" group="Movement" weight=90
    //% sprite.shadow=variables_get sprite.defl=mySprite
    export function setFacing(sprite: Sprite, direction: LabsFacing) {
        actor(sprite).facing = direction;
    }

    //% blockId=labs_get_facing block="$sprite facing" group="Movement" weight=89
    //% sprite.shadow=variables_get sprite.defl=mySprite
    export function facing(sprite: Sprite): LabsFacing { return actor(sprite).facing; }

    /** Move using directional controls. Horizontal facing wins diagonal ties; facing remains when stopped. */
    //% blockId=labs_move_facing block="move $sprite with controls speed x $speedX y $speedY" group="Movement" weight=100
    //% sprite.shadow=variables_get sprite.defl=mySprite speedX.defl=100 speedY.defl=100
    export function moveWithFacing(sprite: Sprite, speedX: number, speedY: number) {
        const a = manage(sprite);
        a.mode = 1; a.sx = Math.max(0, speedX); a.sy = Math.max(0, speedY);
    }

    /**
     * Attach a firing point to the artwork. x/y are image pixels from its center,
     * before rotation or scaling (right/down are positive). Forward describes the
     * artwork at zero degrees. The point and direction follow rotation (degrees).
     */
    //% blockId=labs_set_fire_point block="set $sprite fire point x $x y $y forward $direction" group="Combat" weight=101
    //% sprite.shadow=variables_get sprite.defl=mySprite x.defl=8 y.defl=0 direction.defl=LabsFacing.Right
    export function setFirePoint(sprite: Sprite, x: number, y: number, direction: LabsFacing = LabsFacing.Right) {
        const a = actor(sprite);
        a.hasFirePoint = true; a.fireX = x; a.fireY = y; a.fireFacing = direction;
    }

    /** Return to logical facing and the shoot block's automatic anchor. */
    //% blockId=labs_clear_fire_point block="reset $sprite fire point" group="Combat" weight=79 advanced=true
    //% sprite.shadow=variables_get sprite.defl=mySprite
    export function clearFirePoint(sprite: Sprite) { actor(sprite).hasFirePoint = false; }

    /**
     * Shoot from the attached fire point when configured; it follows the sprite's
     * rotation and scale, and replaces automatic anchor placement. Offset adds
     * world pixels along the firing direction. Without a fire point, use logical facing.
     */
    //% blockId=labs_shoot_forward block="shoot $image from $sprite forward speed $speed || anchor $anchor offset $offset" group="Combat" weight=100
    //% image.shadow=screen_image_picker sprite.shadow=variables_get sprite.defl=mySprite
    //% speed.defl=100 anchor.defl=LabsAnchor.Front offset.defl=0
    //% expandableArgumentMode="toggle"
    //% blockSetVariable=projectile
    export function shootForward(image: Image, sprite: Sprite, speed: number, anchor: LabsAnchor = LabsAnchor.Front, offset: number = 0): Sprite {
        const a = actor(sprite);
        if (a.hasFirePoint) {
            const angle = sprite.rotation;
            const cos = Math.cos(angle), sin = Math.sin(angle);
            const forwardX = a.fireFacing == LabsFacing.Right ? 1 : a.fireFacing == LabsFacing.Left ? -1 : 0;
            const forwardY = a.fireFacing == LabsFacing.Down ? 1 : a.fireFacing == LabsFacing.Up ? -1 : 0;
            const dx = forwardX * cos - forwardY * sin;
            const dy = forwardX * sin + forwardY * cos;
            const x = a.fireX * sprite.sx, y = a.fireY * sprite.sy;
            const projectile = sprites.createProjectileFromSprite(image, sprite, dx * Math.max(0, speed), dy * Math.max(0, speed));
            projectile.setPosition(sprite.x + x * cos - y * sin + dx * offset,
                sprite.y + x * sin + y * cos + dy * offset);
            return projectile;
        }
        const direction = facing(sprite);
        const dx = direction == LabsFacing.Right ? 1 : direction == LabsFacing.Left ? -1 : 0;
        const dy = direction == LabsFacing.Down ? 1 : direction == LabsFacing.Up ? -1 : 0;
        let x = sprite.x;
        let y = sprite.y;
        if (anchor == LabsAnchor.Front || anchor == LabsAnchor.Back) {
            const sign = anchor == LabsAnchor.Front ? 1 : -1;
            x += dx * (sprite.width + image.width) / 2 * sign;
            y += dy * (sprite.height + image.height) / 2 * sign;
        } else if (anchor == LabsAnchor.Top) y -= (sprite.height + image.height) / 2;
        else if (anchor == LabsAnchor.Bottom) y += (sprite.height + image.height) / 2;
        else if (anchor == LabsAnchor.Left) x -= (sprite.width + image.width) / 2;
        else if (anchor == LabsAnchor.Right) x += (sprite.width + image.width) / 2;
        x += dx * offset;
        y += dy * offset;
        const projectile = sprites.createProjectileFromSprite(image, sprite, dx * Math.max(0, speed), dy * Math.max(0, speed));
        projectile.setPosition(x, y);
        return projectile;
    }

    //% blockId=labs_patrol block="patrol $sprite from x $x1 y $y1 to x $x2 y $y2 speed $speed" group="Enemies" weight=100
    //% sprite.shadow=variables_get sprite.defl=enemy speed.defl=40
    export function patrol(sprite: Sprite, x1: number, y1: number, x2: number, y2: number, speed: number) {
        const a = manage(sprite);
        a.mode = 2; a.x1 = x1; a.y1 = y1; a.x2 = x2; a.y2 = y2; a.speed = Math.max(0, speed); a.toEnd = true;
        sprite.setPosition(x1, y1);
    }

    //% blockId=labs_follow block="$sprite follows $target speed $speed stop distance $distance" group="Enemies" weight=90
    //% sprite.shadow=variables_get target.shadow=variables_get speed.defl=40 distance.defl=16
    export function follow(sprite: Sprite, target: Sprite, speed: number, distance: number) {
        const a = manage(sprite);
        a.mode = 3; a.target = target; a.speed = Math.max(0, speed); a.stopDistance = Math.max(0, distance);
    }

    //% blockId=labs_health_set block="give $sprite health $amount" group="Combat" weight=90
    //% sprite.shadow=variables_get amount.defl=3
    export function giveHealth(sprite: Sprite, amount: number) {
        const a = actor(sprite);
        a.maximum = Math.max(0, amount); a.health = a.maximum; a.invulnerableUntil = 0;
    }

    //% blockId=labs_health_get block="$sprite health" group="Combat" weight=88
    //% sprite.shadow=variables_get
    export function health(sprite: Sprite): number { return actor(sprite).health; }

    /** Returns whether damage was applied; health reaching zero does not destroy the sprite automatically. */
    //% blockId=labs_damage block="damage $sprite by $amount invulnerable for $milliseconds ms" group="Combat" weight=89
    //% sprite.shadow=variables_get amount.defl=1 milliseconds.defl=500
    export function damage(sprite: Sprite, amount: number, milliseconds: number): boolean {
        const a = actor(sprite);
        if (amount <= 0 || a.health <= 0 || game.runtime() < a.invulnerableUntil) return false;
        a.health = Math.max(0, a.health - amount);
        a.invulnerableUntil = game.runtime() + Math.max(0, milliseconds);
        return true;
    }

    //% blockId=labs_knockback block="knock $sprite away from $source speed $speed for $milliseconds ms" group="Combat" weight=80 advanced=true
    //% sprite.shadow=variables_get source.shadow=variables_get speed.defl=100 milliseconds.defl=150
    export function knockback(sprite: Sprite, source: Sprite, speed: number, milliseconds: number) {
        const a = manage(sprite);
        let dx = sprite.x - source.x;
        let dy = sprite.y - source.y;
        if (!dx && !dy) dx = 1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (!a.knockbackUntil) { a.previousVX = sprite.vx; a.previousVY = sprite.vy; }
        a.kx = dx / distance * Math.max(0, speed); a.ky = dy / distance * Math.max(0, speed);
        a.knockbackUntil = game.runtime() + Math.max(0, milliseconds);
    }
}
