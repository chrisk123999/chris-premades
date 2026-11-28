import {automationUtils, compendiumUtils, constants, genericUtils, itemUtils, Logging, workflowUtils} from '../../../../../proxy.mjs';
async function createItem({macroClass: {identifier, source}, workflow}) {
    const config = automationUtils.getConfigValues(workflow.item, Object.keys(artisansBlessing.config));
    const data = {packIds: config.compendium.map(c => c.split(':')[1])};
    if (config.nonmagic) genericUtils.setProperty(data, 'lockedFilters.additional.properties', {mgc: -1});
    if (config.itemTypes.length) genericUtils.setProperty(data, 'lockedFilters.types', new Set(config.itemTypes));
    if (Number.isFinite(config.costLimit)) genericUtils.setProperty(data, 'lockedFilters.additional.price', {max: config.costLimit});
    const item = (await compendiumUtils.selectFromCompendiumBrowser('physical', {
        hint: _loc('CHRISPREMADES.Macros.Legacy.ArtisansBlessing.Prompt'),
        title: workflow.item.name,
        icon: workflow.item.img,
        maxAmount: 1,
        ...data
    }))?.[0]?.toObject();
    if (!item) return await workflowUtils.refundUse(workflow);
    if (item.system.type.value === 'ammo') item.system.quantity = 10;
    const created = (await itemUtils.createItems(workflow.actor, [item]))?.[0];
    if (!created) {
        await workflowUtils.refundUse(workflow);
        return Logging.addMacroWarning(source, identifier, `Artisan's Blessing failed to create an item. (activity) ${workflow.activity.uuid} (chosen item) ${item.uuid}`);
    }
    await MidiQOL.addCardNote(workflow, _loc('CHRISPREMADES.Macros.Legacy.ArtisansBlessing.Note', {actor: workflow.actor.name, item: created.name}));
}
export const artisansBlessing = {
    name: 'Channel Divinity: Artisan\'s Blessing',
    version: '2.1.11',
    rules: '2014',
    roll: [
        {
            pass: 'activityRollFinished',
            macro: createItem,
            priority: 50
        }
    ],
    config: {
        compendium: {
            default: [],
            type: 'packOrFolderMultiSelect',
            documentType: 'Item',
            mode: 'pack',
            category: 'behavior',
            label: 'CAT.Settings.Compendiums.Name',
            hint: 'CHRISPREMADES.Macros.Modern.TinkersMagic.CustomCompendium.Hint'
        },
        itemTypes: {
            default: ['consumable', 'container', 'equipment', 'loot', 'tool', 'weapon'],
            type: 'select-many',
            category: 'behavior',
            label: 'CHRISPREMADES.Config.ItemTypes',
            hint: 'CHRISPREMADES.Macros.Generic.Common.ItemType.Hint',
            get options() { return constants.physicalItemTypes; }
        },
        costLimit: {
            default: 100,
            type: 'number',
            category: 'behavior',
            label: 'DND5E.Cost',
            hint: 'CHRISPREMADES.Macros.Legacy.ArtisansBlessing.CostHint'
        },
        nonmagic: {
            default: true,
            type: 'checkbox',
            category: 'behavior',
            label: 'CHRISPREMADES.Macros.Legacy.BlessingOfTheForge.NonmagicalOnly'
        }
    }
};
