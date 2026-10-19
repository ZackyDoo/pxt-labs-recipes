// Left/right rotate the player. Press A to fire from the same gun tip.
scene.setBackgroundColor(1)
let player = sprites.create(img`
    . . . . . . . . . . . . . . . .
    . . . . 8 8 8 8 8 8 . . . . . .
    . . . 8 9 9 9 9 9 9 8 . . . . .
    . . 8 9 9 9 9 9 9 9 8 8 8 8 8 8
    . . 8 9 9 9 9 9 9 9 8 5 5 5 5 5
    . . 8 9 9 9 9 9 9 9 8 . . . . .
    . . 8 9 9 9 9 9 9 9 8 . . . . .
    . . 8 9 9 9 9 9 9 9 8 . . . . .
    . . . 8 9 9 9 9 9 9 8 . . . . .
    . . . . 8 8 8 8 8 8 . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
`, SpriteKind.Player)
player.setPosition(80, 60)
// Image-center offsets: eight pixels right, two pixels up.
// The original, unrotated gun points right.
labs.setFirePoint(player, 8, -2, LabsFacing.Right)
game.onUpdate(function () {
    if (controller.left.isPressed()) player.rotationDegrees += -2
    if (controller.right.isPressed()) player.rotationDegrees += 2
})
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    let projectile = labs.shootForward(img`
        5 5
        5 5
    `, player, 100)
})
