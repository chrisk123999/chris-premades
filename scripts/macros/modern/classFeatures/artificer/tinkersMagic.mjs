import {actorUtils, automationUtils, compendiumUtils, constants, documentUtils, effectUtils, genericUtils, itemUtils} from '../../../../proxy.mjs';
const itemIDs = new Set([
    'ball-bearings', 'basket', 'bedroll', 'bell', 'blanket', 'block-and-tackle', 'bottle-glass', 'bucket',
    'caltrops', 'candle', 
    'flask', 
    'grappling-hook', 
    'hunting-trap', 
    'jug', 
    'lamp', 
    'manacles', 
    'net', 
    'oil', 
    'paper', 'parchment', 'pouch', 
    'rope', 
    'sack', 'shovel', 'spikes-iron', 'iron-spike', 'string', 
    'tinderbox', 'torch', 
    'vial'
]);
async function use({workflow}) {
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(tinkersMagic.config));
    if (config.requireTools?.length && !workflow.actor.itemTypes.tool.some(t => config.requireTools.includes(t.system.type?.baseItem) && t.system.equipped)) {
        const tools = constants.toolOptions.filter(o => config.requireTools.includes(o.value)).map(t => t.label).join(', ');
        genericUtils.notify('CHRISPREMADES.Macros.Modern.TinkersMagic.NeedTools', {type: 'warn', format: {feature: workflow.item.name, tools}});
        return;
    }
    const options = {
        maxAmount: 1,
        icon: workflow.item.img,
        title: workflow.item.name,
        hint: _loc('CHRISPREMADES.Macros.Modern.TinkersMagic.Prompt'),
        lockedFilters: {additional: {rarity: {
            ...Object.keys(CONFIG.DND5E.itemRarity).reduce((obj, key) => (obj[key] = -1, obj), {}),
            _blank: 1
        }}}
    };
    if (config.itemTypes?.length) options.lockedFilters.types = new Set(config.itemTypes);
    if (config.compendium?.length) options.packIds = config.compendium.map(c => c.split(':')[1]);
    else options.filterPredicate = (entry) => itemIDs.has(entry.system.identifier);
    const item = (await compendiumUtils.selectFromCompendiumBrowser('items', options))?.[0];
    if (!item) return;
    let parentEntity = actorUtils.getEffectByIdentifier(workflow.actor, 'tinkersMagic');
    parentEntity ??= (await effectUtils.createEffects(workflow.actor, [{
        showIcon: 0,
        img: workflow.item.img,
        name: workflow.item.name,
        origin: workflow.item.uuid,
        duration: {expiry: 'updateWorldTime'},
        flags: {
            cat: {identifier: 'tinkersMagic'},
            dae: {
                activity: workflow.activity.uuid,
                specialDuration: ['longRest'],
                expiryMode: 'delete'
            }
        }
    }], {macros: [{type: 'rest', macros: [{source: 'chris-premades', identifier: 'tinkers-magic', rules: tinkersMagic.rules}]}]}))?.[0];
    if (!parentEntity) return;
    const target = workflow.targets.first()?.actor ?? workflow.actor;
    await itemUtils.createItems(target, [item.toObject()], {parentEntity});
}
// DAE long rest special duration suppresses instead of deleting, despite settings
async function remove({document: effect}) {
    await documentUtils.deleteDocument(effect);
}
export const tinkersMagic = {
    name: 'Tinker\'s Magic',
    version: '2.0.4',
    rules: '2024',
    notes: 'Target a willing creature to create an item in their inventory. The item is otherwise made on this character.',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: use,
            priority: 50
        }
    ],
    rest: [
        {
            pass: 'actorLong',
            macro: remove,
            priority: 200
        }
    ],
    config: {
        requireTools: {
            default: ['tinker'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.TinkersMagic.RequireTools',
            hint: 'CHRISPREMADES.Macros.Modern.TinkersMagic.RequireToolsHint',
            get options() { return constants.toolOptions; }
        },
        compendium: {
            default: [],
            type: 'packOrFolderMultiSelect',
            documentType: 'Item',
            mode: 'pack',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Modern.TinkersMagic.CustomCompendium',
            hint: 'CHRISPREMADES.Macros.Modern.TinkersMagic.CustomCompendiumHint'
        },
        itemTypes: {
            default: ['container', 'consumable', 'loot'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Common.ItemTypeHint',
            get options() { return constants.physicalItemTypes; }
        }
    }
};
