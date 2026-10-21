namespace labs {
    /** Choose which built-in counters appear on screen. Their values and events still work when hidden, so you can draw your own scoreboard with HUD or text blocks. */
    //% blockId=labs_builtin_hud block="show built-in score $score lives $lives countdown $countdown" group="HUD" blockNamespace=labsHUD color="#cf6a87"
    //% score.shadow=toggleOnOff lives.shadow=toggleOnOff countdown.shadow=toggleOnOff score.defl=true lives.defl=true countdown.defl=true
    export function showBuiltinHud(score: boolean, lives: boolean, countdown: boolean) {
        info.showScore(score); info.showLife(lives); info.showCountdown(countdown);
    }
    /** Each separate painted shape becomes a sprite of this kind, at its place in the picture. Transparent gaps separate shapes; touching pixels join them. The optional x and y move the whole layout. Invisible shapes can mark platforms, ladders or triggers behind background art. Returns the new sprites. */
    //% blockId=labs_image_shapes block="make sprites of kind $kind from shapes in $picture || origin x $x y $y invisible $invisible" group="Tilemaps" blockNamespace=labsWorld color="#4b6584"
    //% kind.shadow=spritekind picture.shadow=screen_image_picker x.defl=0 y.defl=0 invisible.shadow=toggleOnOff expandableArgumentMode="toggle" blockSetVariable=pieces
    export function spritesFromShapes(kind: number, picture: Image, x: number = 0, y: number = 0, invisible: boolean = false): Sprite[] {
        const result: Sprite[] = [];
        if (!picture) return result;
        const visited = image.create(picture.width, picture.height);
        for (let py = 0; py < picture.height; py++) for (let px = 0; px < picture.width; px++) {
            if (!picture.getPixel(px, py) || visited.getPixel(px, py)) continue;
            const points = [py * picture.width + px];
            visited.setPixel(px, py, 1);
            let left = px, right = px, top = py, bottom = py;
            for (let i = 0; i < points.length; i++) {
                const sx = points[i] % picture.width, sy = Math.idiv(points[i], picture.width);
                left = Math.min(left, sx); right = Math.max(right, sx); top = Math.min(top, sy); bottom = Math.max(bottom, sy);
                for (let direction = 0; direction < 4; direction++) {
                    const nx = sx + (direction == 0 ? -1 : direction == 1 ? 1 : 0);
                    const ny = sy + (direction == 2 ? -1 : direction == 3 ? 1 : 0);
                    if (nx >= 0 && ny >= 0 && nx < picture.width && ny < picture.height && picture.getPixel(nx, ny) && !visited.getPixel(nx, ny)) {
                        visited.setPixel(nx, ny, 1); points.push(ny * picture.width + nx);
                    }
                }
            }
            const art = image.create(right - left + 1, bottom - top + 1);
            for (let point of points) {
                const sx = point % picture.width, sy = Math.idiv(point, picture.width);
                art.setPixel(sx - left, sy - top, picture.getPixel(sx, sy));
            }
            const sprite = sprites.create(art, kind);
            sprite.setPosition(x + (left + right + 1) / 2, y + (top + bottom + 1) / 2);
            sprite.setFlag(SpriteFlag.Invisible, invisible);
            result.push(sprite);
        }
        return result;
    }
}
