namespace labsInventory {
    /** Open a menu of the bag's current items. A chooses an item and runs the code inside, with its name and current amount. B closes the menu. Choosing does not use up the item; use the remove block when you want that. */
    //% blockId=labs_inventory_choose block="choose item from $bag with $name $amount" group="Menu" handlerStatement=1 draggableParameters=reporter
    //% bag.shadow=variables_get bag.defl=bag
    export function chooseItem(bag: LabsInventory, handler: (name: string, amount: number) => void) {
        if (!bag) return;
        const names = bag.names.slice(), choices: miniMenu.MenuItem[] = [];
        for (let i = 0; i < names.length; i++) choices.push(miniMenu.createMenuItem(names[i] + " x" + bag.amounts[i], bag.pictures[i]));
        if (!choices.length) choices.push(miniMenu.createMenuItem("Empty", null, true));
        const menu = miniMenu.createMenuFromArray(choices);
        miniMenu.setTitle(menu, "Inventory");
        miniMenu.onButtonPressed(menu, miniMenu.Button.B, () => miniMenu.close(menu));
        miniMenu.onButtonPressed(menu, miniMenu.Button.A, (label, index) => {
            if (index < 0 || index >= names.length) return;
            const name = names[index], amount = count(bag, name);
            if (amount > 0) { miniMenu.close(menu); handler(name, amount); }
        });
    }
}
