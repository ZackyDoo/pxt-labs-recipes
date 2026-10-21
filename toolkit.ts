// Original Labs implementations. These do not copy third-party inventory,
// sight, or random-number extensions with missing or incompatible licenses.
class LabsRandomSource {
    value: number;
    constructor(seed: number) {
        this.value = Math.floor(seed) % 2147483646;
        if (this.value <= 0) this.value += 2147483646;
    }
    next(): number {
        const quotient = Math.floor(this.value / 127773);
        this.value = 16807 * (this.value - quotient * 127773) - 2836 * quotient;
        if (this.value <= 0) this.value += 2147483647;
        return this.value;
    }
}

class LabsInventory {
    names: string[] = [];
    amounts: number[] = [];
    pictures: Image[] = [];
    constructor(public capacity: number) { }
}

namespace labs {
    let achievementHandlers: ((name: string) => void)[] = [];

    /** Remember that this achievement was earned in this project on this browser or device. True means it was just earned; earning it again returns false and does not repeat its event. */
    //% blockId=labs_unlock_achievement block="unlock achievement $name" group="Achievements" blockSetVariable=earned blockNamespace=labsAchievements color="#8854D0"
    //% name.defl="first win"
    export function unlockAchievement(name: string): boolean {
        if (!name || achievementUnlocked(name)) return false;
        settings.writeNumber("__labs_achievement:" + name, 1);
        for (let handler of achievementHandlers) control.runInParallel(() => handler(name));
        return true;
    }

    /** True if this project has already saved this achievement as earned on the current browser or device. */
    //% blockId=labs_achievement_unlocked block="achievement $name is unlocked" group="Achievements" blockNamespace=labsAchievements color="#8854D0"
    //% name.defl="first win"
    export function achievementUnlocked(name: string): boolean { return !!name && settings.readNumber("__labs_achievement:" + name) == 1; }

    /** Run this code once when any new achievement is earned. The name tells you which one; use normal text, sound or effects blocks to celebrate it. Previously saved achievements do not fire this event again. */
    //% blockId=labs_on_achievement block="when achievement unlocked $name" group="Achievements" handlerStatement=1 draggableParameters=reporter blockNamespace=labsAchievements color="#8854D0"
    export function onAchievementUnlocked(handler: (name: string) => void) { achievementHandlers.push(handler); }

    /** Forget only this saved achievement so it can be earned again. Other achievements and saved game data are kept. */
    //% blockId=labs_reset_achievement block="reset achievement $name" group="Achievements" blockNamespace=labsAchievements color="#8854D0"
    //% name.defl="first win"
    export function resetAchievement(name: string) { if (name) settings.remove("__labs_achievement:" + name); }

    /** Make a separate random-number stream. The same seed repeats the same results. Other streams and Arcade's ordinary random blocks are not changed. */
    //% blockId=labs_seeded_random block="random source with seed $seed" group="Seeded random" blockSetVariable=randomSource blockNamespace=labsRandom color="#A55EEA"
    //% seed.defl=12345
    export function randomSource(seed: number): LabsRandomSource { return new LabsRandomSource(seed); }

    /** Pick a whole number between the two limits, including both limits, using this source. Keeping the seed the same lets you repeat a level or test. */
    //% blockId=labs_seeded_integer block="$source pick whole number from $low to $high" group="Seeded random" blockNamespace=labsRandom color="#A55EEA"
    //% source.shadow=variables_get source.defl=randomSource low.defl=0 high.defl=10
    export function randomInteger(source: LabsRandomSource, low: number, high: number): number {
        let start = Math.ceil(Math.min(low, high)), end = Math.floor(Math.max(low, high));
        if (!source || start > end) return start;
        return start + Math.floor((source.next() - 1) / 2147483646 * (end - start + 1));
    }

    function clearSight(a: Sprite, b: Sprite): boolean {
        if (!a || !b) return false;
        const map = game.currentScene().tileMap;
        if (!map || !map.data) return true;
        const size = 1 << map.scale;
        let x = Math.floor(a.x / size), y = Math.floor(a.y / size);
        const endX = Math.floor(b.x / size), endY = Math.floor(b.y / size);
        const dx = b.x - a.x, dy = b.y - a.y;
        const stepX = dx > 0 ? 1 : -1, stepY = dy > 0 ? 1 : -1;
        const deltaX = dx == 0 ? 1e20 : size / Math.abs(dx);
        const deltaY = dy == 0 ? 1e20 : size / Math.abs(dy);
        let nextX = dx == 0 ? 1e20 : ((dx > 0 ? (x + 1) * size : x * size) - a.x) / dx;
        let nextY = dy == 0 ? 1e20 : ((dy > 0 ? (y + 1) * size : y * size) - a.y) / dy;
        function blocked(col: number, row: number): boolean {
            return col < 0 || row < 0 || col >= map.data.width || row >= map.data.height || tiles.tileAtLocationIsWall(tiles.getTileLocation(col, row));
        }
        if (blocked(x, y) || blocked(endX, endY)) return false;
        while (x != endX || y != endY) {
            if (Math.abs(nextX - nextY) < 0.000001) {
                // A diagonal glance must not pass through the touching corners of walls.
                if (blocked(x + stepX, y) || blocked(x, y + stepY)) return false;
                x += stepX; y += stepY; nextX += deltaX; nextY += deltaY;
            } else if (nextX < nextY) { x += stepX; nextX += deltaX; }
            else { y += stepY; nextY += deltaY; }
            if (blocked(x, y)) return false;
        }
        return true;
    }

    /** True when a straight line between the sprites' centers crosses no wall tiles. Sprites do not block this line. Outside the tilemap counts as blocked. */
    //% blockId=labs_clear_sight block="clear line of sight from $observer to $target" group="Sight" blockNamespace=labsSight color="#3867d6"
    //% observer.shadow=variables_get observer.defl=enemy target.shadow=variables_get target.defl=mySprite
    export function clearLineOfSight(observer: Sprite, target: Sprite): boolean { return clearSight(observer, target); }

    /** Check whether a character can see a target in front of it, within the distance and viewing angle, without a wall in the way. Facing uses the existing Labs facing blocks; 360 degrees sees in every direction. */
    //% blockId=labs_can_see block="$observer can see $target within $distance pixels || viewing angle $angle degrees" group="Sight" blockNamespace=labsSight color="#3867d6"
    //% observer.shadow=variables_get observer.defl=enemy target.shadow=variables_get target.defl=mySprite distance.defl=80 angle.defl=120 angle.min=0 angle.max=360 expandableArgumentMode=toggle
    export function canSee(observer: Sprite, target: Sprite, distance: number = 80, angle: number = 120): boolean {
        if (!observer || !target || distance < 0) return false;
        const dx = target.x - observer.x, dy = target.y - observer.y, length = Math.sqrt(dx * dx + dy * dy);
        if (length > distance) return false;
        if (length > 0 && angle < 360) {
            const direction = labs.facing(observer);
            const forward = direction == LabsFacing.Right ? dx : direction == LabsFacing.Left ? -dx : direction == LabsFacing.Down ? dy : -dy;
            if (forward / length + 0.000001 < Math.cos(Math.constrain(angle, 0, 360) * Math.PI / 360)) return false;
        }
        return clearSight(observer, target);
    }
}

//% block="Labs Inventory" color="#D54322" icon="\uf0b1" weight=44
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
