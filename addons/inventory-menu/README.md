# Labs Inventory Menu

The **choose item from bag** block, in **Inventory**, is included in Labs 0.4.0.
Install `https://github.com/ZackyDoo/pxt-labs-recipes/addons/inventory-menu`
through Arcade's Extensions dialog to use the inventory chooser separately.
This loads the shared inventory data package and the original Mini Menu
extension, without copying Mini Menu's code or pulling in the full super extension.

A selects an item, B closes the menu, and selecting an item does not consume it.
Use the remove-item block in the handler to consume it.

The site used `inventory.chooseItem`; standalone Labs uses
`labsInventory.chooseItem` to avoid taking over another extension's namespace.
Existing Labs inventory block IDs are preserved for Blocks imports.
