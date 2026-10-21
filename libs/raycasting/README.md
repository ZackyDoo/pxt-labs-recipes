# Raycasting compatibility package

This is the standalone site's MIT-licensed adaptation of
`AqeeAqee/pxt-raycasting` commit
`bd658396502922354638ab5dafbcc6245aeee877`.
The upstream license is preserved in LICENSE.

It preserves the Render API and existing block IDs. The important compatibility
change is `fixedInstance whenUsed` on `Render.raycastingRender`: ordinary 2D games
must not create a raycaster, extra player sprite, camera controller, or screen
update hook merely because the extension is installed. The other runtime fix
reads tile indices through the current tilemap, including indices above 127.
Labels/tooltips match the standalone site.

The main extension resolves this as the conventional `pxt-raycasting` package ID,
so a normal dependency graph has one implementation. Keep that package ID when
declaring a dependency. A separate original renderer under a different alias is
a different package to MakeCode and can collide with these global Render APIs.
Do not load two implementations under different aliases. As with the site,
activate one primary renderer/camera system per scene; importing several tools
does not mean simultaneous raycasting and split-screen modes are supported.
