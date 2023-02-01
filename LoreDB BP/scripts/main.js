import { Container, Entity, ItemStack, Location, MinecraftItemTypes, system, world, BlockLocation } from '@minecraft/server'
//import "./scoredb"

const ow = world.getDimension('overworld');
const loc = new BlockLocation(0, 0, 0)

let onceResolved = false;

const worldLoad = () => {
    return new Promise((resolve) => {
        if (onceResolved) { resolve(); return; }
        const id = system.runSchedule(() => {
            const block = ow.getBlock(loc)
            if (!block) return
            onceResolved = block
            resolve()
            system.clearRunSchedule(id)
        })
    })
}

world.events.worldInitialize.subscribe(() => {
    onceResolved = true;
})

class DB {

    /** @type {Entity} */
    entity;

    /** @type {Container}*/
    container;

    initialized = false;
    cache = {};
    itemCache = {}

    constructor(name) {
        this.name = name;
    }

    /**
     * 
     * @param {string} key 
     * @returns {number}
     */

    getItemIndex(key) {
        if (this.cache[key]?.index) return this.cache[key].index;
        const lower = key.toLowerCase();
        var codes = 0;
        for (let i = 0; i < lower.length; i++) {
            const charCode = key.charCodeAt(i) - 97;
            if (charCode >= 0) { codes += charCode; continue }
            codes += Number(key.charAt(i)) * 3
        }
        const i = Math.floor(codes / key.length);
        this.cache[key] = { index: i }
        return i;
    }

    async inizializeEntity() {
        await worldLoad().catch(e => console.error(e))
        const dbs = [...ow.getEntities({ type: "dest:database", name: this.name })];
        if (dbs.length > 0) { this.entity = dbs[0]; return; }
        const entity = ow.spawnEntity("dest:database", new Location(0, 0, 0))
        entity.nameTag = this.name
        this.entity = entity;
    }

    async inizialize() {
        if (this.initialized) return;
        await this.inizializeEntity().catch(e => console.error(e))
        this.container = this.entity.getComponent("inventory").container;
        this.initialized = true;
    }

    /**
     * @param {string} key 
     * @param {*} value 
     */
    async setDataAsync(key, value) {
        await this.inizialize().catch(e => console.error(e))
        const index = this.getItemIndex(key);
        var item = this.container.getItem(index);
        if (!item) {
            item = new ItemStack(MinecraftItemTypes.ironSword, 1)
        }
        const lore = item.getLore();
        let data = JSON.parse(lore[1] ?? "{}");
        data[key] = value;
        const str = JSON.stringify(data)
        item.setLore([lore[0] ?? "{}", str]);
        this.container.setItem(index, item)
        this.itemCache[key] = value;
    }

    /**
     * @param {string} key 
     */

    async getDataAsync(key) {
        await this.inizialize().catch(e => console.error(e))
        if (this.itemCache[key]) return this.itemCache[key]
        const index = this.getItemIndex(key);
        const item = this.container.getItem(index);
        if (!item) return null;
        const lore = item.getLore();
        this.itemCache[key] = lore[1]
        return JSON.parse(lore[1])[key]
    }
}
//const db = new DB("Test")
//
//
//world.events.blockBreak.subscribe(async () => {
//    let prev = await db.getDataAsync("blocks") ?? []
//    prev.push(Math.random())
//    console.warn(prev[0], prev[prev.length - 1])
//    await db.setDataAsync("blocks", prev)
//})
//
//system.runSchedule(async () => {
//    let prev = await db.getDataAsync("test") ?? []
//    prev.push(Math.random())
//    console.warn(JSON.stringify(prev).length)
//    await db.setDataAsync("test", prev)
//})