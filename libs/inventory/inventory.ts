

class LabsInventory {
    names: string[] = [];
    amounts: number[] = [];
    pictures: Image[] = [];
    constructor(public capacity: number) { }
}


//% block="Inventory" color="#D54322" icon="\uf0b1" weight=44
//% groups='["Bag", "Items", "Menu"]'
namespace labsInventory {
    /** Make an empty bag. Slots count different item names, not individual copies: five coins use one slot. Each bag keeps its own items. */
    //% blockId=labs_inventory_create block="bag with $slots item slots" group="Bag" blockSetVariable=bag
    //% slots.defl=8 slots.min=1 slots.max=100
    export function create(slots: number = 8): LabsInventory { return new LabsInventory(Math.constrain(Math.floor(slots), 1, 100)); }

    /** Try to add this many copies of an item. True means it all fits. False means the bag is full or the amount is invalid, and nothing changes. Matching names stack together; use a different name for a different item. */
    //% blockId=labs_inventory_add block="add $amount of $name with icon $picture to $bag" group="Items" blockSetVariable=added
    //% bag.shadow=variables_get bag.defl=bag amount.defl=1 name.defl="coin" picture.shadow=screen_image_picker
    export function add(bag: LabsInventory, name: string, picture: Image, amount: number = 1): boolean {
        amount = Math.floor(amount);
        if (!bag || !name || amount <= 0) return false;
        const index = bag.names.indexOf(name);
        if (index >= 0) { bag.amounts[index] += amount; return true; }
        if (bag.names.length >= bag.capacity) return false;
        bag.names.push(name); bag.amounts.push(amount); bag.pictures.push(picture || image.create(1, 1));
        return true;
    }

    /** Remove this many copies only if the bag has enough. True means they were removed; false leaves the bag unchanged. Removing the last copy frees its slot. */
    //% blockId=labs_inventory_remove block="remove $amount of $name from $bag" group="Items" blockSetVariable=removed
    //% bag.shadow=variables_get bag.defl=bag name.defl="coin" amount.defl=1
    export function remove(bag: LabsInventory, name: string, amount: number = 1): boolean {
        amount = Math.floor(amount);
        if (!bag || amount <= 0) return false;
        const index = bag.names.indexOf(name);
        if (index < 0 || bag.amounts[index] < amount) return false;
        bag.amounts[index] -= amount;
        if (bag.amounts[index] == 0) { bag.names.removeAt(index); bag.amounts.removeAt(index); bag.pictures.removeAt(index); }
        return true;
    }

    /** Get how many copies of this item are in the bag. An item that is not in the bag has zero copies. */
    //% blockId=labs_inventory_count block="$bag count of $name" group="Items"
    //% bag.shadow=variables_get bag.defl=bag name.defl="coin"
    export function count(bag: LabsInventory, name: string): number { const i = bag ? bag.names.indexOf(name) : -1; return i >= 0 ? bag.amounts[i] : 0; }

    /** Get the names of the items currently in this bag. Changing this list does not change the bag. */
    //% blockId=labs_inventory_names block="$bag item names" group="Bag"
    //% bag.shadow=variables_get bag.defl=bag
    export function itemNames(bag: LabsInventory): string[] { return bag ? bag.names.slice() : []; }

    /** Get the number of slots available for new item names. Items already in the bag can still stack when this reaches zero. */
    //% blockId=labs_inventory_slots block="$bag empty slots" group="Bag"
    //% bag.shadow=variables_get bag.defl=bag
    export function emptySlots(bag: LabsInventory): number { return bag ? bag.capacity - bag.names.length : 0; }

    /** Remove every item from this bag. Other bags are not changed. */
    //% blockId=labs_inventory_clear block="empty $bag" group="Bag"
    //% bag.shadow=variables_get bag.defl=bag
    export function clear(bag: LabsInventory) { if (bag) { bag.names = []; bag.amounts = []; bag.pictures = []; } }

}
