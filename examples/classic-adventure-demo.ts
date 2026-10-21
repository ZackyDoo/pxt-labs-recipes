// Arrow keys move in one direction at a time, including when two keys are held.
// Cross the middle of the map to slide into the next room. Both rooms remain editable.
tiles.setCurrentTilemap(tilemap`classic_training`)
scene.setBackgroundColor(7)
let player = sprites.create(img`
    . . 4 4 4 4 . .
    . 4 1 4 4 1 4 .
    . 4 4 4 4 4 4 .
    . . 4 4 4 4 . .
    . . 4 4 4 4 . .
    . 4 4 4 4 4 4 .
    . 4 . . . . 4 .
    . 4 . . . . 4 .
`, SpriteKind.Player)
player.setPosition(32, 64)
labs.moveFourDirections(player, 80)
labs.roomCamera(player)
