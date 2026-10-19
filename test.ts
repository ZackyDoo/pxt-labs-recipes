// A real Arcade game made with simple pixel shapes.
// Move with the direction buttons. Press A to fire along the last facing direction.
scene.setBackgroundColor(1)
let player = sprites.create(img`
    . . 8 8 8 8 . .
    . 8 9 9 9 9 8 .
    8 9 9 9 9 9 9 8
    8 9 9 9 9 9 9 8
    8 9 9 9 9 9 9 8
    8 9 9 9 9 9 9 8
    . 8 9 9 9 9 8 .
    . . 8 8 8 8 . .
`, SpriteKind.Player)
player.setStayInScreen(true)
labs.moveWithFacing(player, 70, 70)
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    let projectile = labs.shootForward(img`
        5 5
        5 5
    `, player, 100, LabsAnchor.Front, 1)
})
