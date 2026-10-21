// A jumps; release A for a shorter jump. Up/down climbs the cyan ladders.
// Down drops through the green sprite platform. The tile floor stays solid.
tiles.setCurrentTilemap(tilemap`classic_training`)
scene.setBackgroundColor(8)
let player = sprites.create(img`
    . . 9 9 9 9 . .
    . 9 1 9 9 1 9 .
    . 9 9 9 9 9 9 .
    . . 9 9 9 9 . .
    . . 9 9 9 9 . .
    . 9 9 9 9 9 9 .
    . 9 . . . . 9 .
    . 9 . . . . 9 .
`, SpriteKind.Player)
player.setPosition(32, 96)
controller.moveSprite(player, 70, 0)
labs.forgivingJump(player, 150, 350)
labs.climbLadders(player, assets.tile`Training ladder`, 50)
let platform = sprites.create(img`
    7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7
    7 7 7 7 7 7 7 7 7 7 7 7 7 7 7 7
`, SpriteKind.Food)
platform.sx = 5
platform.setPosition(104, 72)
labs.standOnPlatform(player, platform)
controller.down.onEvent(ControllerButtonEvent.Pressed, function () {
    labs.dropThroughPlatforms(player, 250)
})
game.onUpdate(function () {
    if (labs.isOnPlatform(player)) {
        info.setScore(1)
    } else {
        info.setScore(0)
    }
})
scene.cameraFollowSprite(player)
