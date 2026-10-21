# Labs Inventory Menu

Optional **choose item from bag** block, in **Labs Inventory**.
Install `https://github.com/ZackyDoo/pxt-labs-recipes/addons/inventory-menu`
through Arcade's Extensions dialog. This loads Labs core and the original
Mini Menu extension as dependencies, without copying Mini Menu's code.

A selects an item, B closes the menu, and selecting an item does not consume it.
Use the remove-item block in the handler to consume it.

The site used `inventory.chooseItem`; standalone Labs uses
`labsInventory.chooseItem` to avoid taking over another extension's namespace.
Existing Labs inventory block IDs are preserved for Blocks imports.
