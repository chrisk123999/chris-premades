import {compendiumUtils, documentUtils, genericUtils, itemUtils, rollUtils} from '../../../proxy.mjs';
const gear = {
    lantern: {2014: 'bullseye-lantern', 2024: 'lantern-bullseye'},
    dagger: {2014: 'dagger', 2024: 'dagger'},
    mirror: {2014: 'steel-mirror', 2024: 'mirror'},
    pole: {2014: 'pole', 2024: 'pole'},
    rope: {2014: 'hempen-rope-50-ft', 2024: 'rope'},
    sack: {2014: 'sack', 2024: 'sack'},
    potion: {2014: 'potion-of-healing', 2024: 'potion-of-healing'},
    ram: {2014: 'portable-ram', 2024: 'ram-portable'},
    silverCoffer: 'silver-coffer',
    ironDoor: 'iron-door',
    gems: 'gems',
    ladder: 'wooden-ladder',
    pit: 'pit',
    rowboat: 'rowboat',
    spellScroll: 'spell-scroll',
    window: 'window'
};
const creatures = {
    horse: {2014: 'Compendium.dnd5e.monsters.Actor.rz8UTUnFT87BsAFR', 2024: 'Compendium.dnd5e.actors24.Actor.mmRidingHorse000', count: 1},
    mastiffs: {2014: 'Compendium.dnd5e.monsters.Actor.YTpL2c3NO4sOn2UA', 2024: 'Compendium.dnd5e.actors24.Actor.mmMastiff0000000', count: 2}
};
const table = [[8, 'gold'], [15, 'silverCoffer'], [22, 'ironDoor'], [30, 'gems'], [44, 'ladder'], [51, 'horse'], [59, 'pit'], [68, 'potion'], [75, 'rowboat'], [83, 'spellScroll'], [90, 'mastiffs'], [96, 'window'], [100, 'ram']];
const quantities = {potion: 4};
export async function findItem(identifier, rules) {
    const packIds = [...compendiumUtils.getEnabledCompendiumIds('itemCompendiums'), 'chris-premades.CPREquipment' + rules, rules === '2024' ? 'dnd5e.equipment24' : 'dnd5e.items'];
    for (const packId of packIds) {
        if (!game.packs.get(packId)) continue;
        const uuid = await compendiumUtils.getDocumentUuidByIdentifier(packId, identifier);
        if (uuid) return uuid;
    }
}
async function patchData(template, key, rules) {
    let stored;
    if (creatures[key]) stored = {uuid: creatures[key][rules], count: creatures[key].count};
    else if (key === 'gold') stored = {uuid: await findItem(gear.sack[rules], rules), updates: {name: _loc('CHRISPREMADES.Macros.All.RobeOfUsefulItems.Gold'), system: {currency: {gp: 100}}}};
    else {
        const identifier = typeof gear[key] === 'string' ? gear[key] : gear[key][rules];
        stored = {uuid: await findItem(identifier, rules), quantity: quantities[key]};
    }
    if (!stored.uuid) return;
    const source = await fromUuid(stored.uuid);
    const data = genericUtils.duplicate(template);
    delete data._id;
    data.name = template.name + ': ' + (stored.updates?.name ?? source?.name ?? key);
    data.img = source?.img ?? data.img;
    genericUtils.setProperty(data, 'flags.cat.storedItem', stored);
    return data;
}
async function setup({document: item, workflow}) {
    const rules = documentUtils.getRules(item);
    const template = itemUtils.getActivityByIdentifier(item, 'setup') && (await compendiumUtils.getDocumentByIdentifier('chris-premades.CPREquipment' + rules, 'robe-of-useful-items-patch', {object: true}));
    if (!template) return genericUtils.notify('CHRISPREMADES.Macros.All.RobeOfUsefulItems.NoPatch', {type: 'warn'});
    const keys = ['lantern', 'dagger', 'mirror', 'pole', 'rope', 'sack'].flatMap(key => [key, key]);
    const extra = workflow.utilityRolls?.[0]?.total ?? 0;
    for (let i = 0; i < extra; i++) {
        const {roll} = await rollUtils.rollDice('1d100', {document: workflow.actor, message: true, flavor: item.name});
        keys.push(table.find(([max]) => roll.total <= max)[1]);
    }
    const robe = workflow.actor.items.find(other => other.type === 'container' && documentUtils.getIdentifier(other) === 'robe-of-useful-items');
    const patches = [];
    for (const key of keys) {
        const data = await patchData(template, key, rules);
        if (!data) continue;
        const same = patches.find(other => other.name === data.name);
        if (same) same.system.quantity = (same.system.quantity ?? 1) + 1;
        else {
            if (robe) data.system.container = robe.id;
            patches.push(data);
        }
    }
    await itemUtils.createItems(workflow.actor, patches);
}
export const robeOfUsefulItemsSetup = {
    name: 'Robe of Useful Items: Setup',
    version: '2.1.7',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: setup,
            priority: 50
        }
    ]
};
