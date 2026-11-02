import {actorUtils, compendiumUtils, documentUtils, effectUtils, genericUtils, itemUtils, Logging} from '../../../proxy.mjs';
async function transform({document: item, workflow}) {
    if (workflow.activity.identifier !== 'transform-tool' || !itemUtils.getEquipmentState(item)) return;
    const packIds = compendiumUtils.getEnabledCompendiumIds('itemCompendiums');
    const [tool] = await compendiumUtils.selectFromCompendiumBrowser('physical', {packIds: packIds.length ? packIds : undefined, lockedFilters: {types: new Set(['tool'])}, maxAmount: 1, title: item.name}) ?? [];
    if (!tool) return;
    for (const previous of item.actor.items.filter(other => other.flags.cat?.allPurposeTool === item.id)) await documentUtils.deleteDocument(previous);
    const toolData = tool.toObject();
    toolData.name = item.name + ': ' + toolData.name;
    toolData.system.proficient = Math.max(toolData.system.proficient ?? 0, 1);
    genericUtils.setProperty(toolData, 'flags.cat.allPurposeTool', item.id);
    await itemUtils.createItems(item.actor, [toolData], {parentEntity: item});
}
async function channel({document: item, workflow}) {
    if (workflow.activity.identifier !== 'channel-creative-forces' || !itemUtils.getEquipmentState(item)) return;
    const packIds = compendiumUtils.getEnabledCompendiumIds('spellCompendiums');
    if (!packIds.length) return Logging.addMacroWarning('CPR', 'all-purpose-tool', 'CAT.Error.NoSpellCompendiums', {notify: 'warn'});
    const [spell] = await compendiumUtils.selectFromCompendiumBrowser('spells', {packIds, lockedFilters: {additional: {level: {min: 0, max: 0}}}, maxAmount: 1, title: item.name}) ?? [];
    if (!spell) return;
    const spellData = spell.toObject();
    spellData.name = item.name + ': ' + spellData.name;
    spellData.system.sourceItem = 'class:artificer';
    const previous = actorUtils.getEffectByIdentifier(workflow.actor, 'allPurposeToolCantrip');
    if (previous) await documentUtils.deleteDocument(previous);
    const [effect] = await effectUtils.createEffects(workflow.actor, [{name: item.name, img: item.img, origin: item.uuid, duration: {value: 28800, units: 'seconds'}, flags: {cat: {identifier: 'allPurposeToolCantrip'}}}]);
    if (effect) await itemUtils.createItems(workflow.actor, [spellData], {parentEntity: effect});
}
export const allPurposeTool = {
    name: 'All-Purpose Tool',
    version: '2.1.7',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: transform,
            priority: 50
        },
        {
            pass: 'itemRollFinished',
            macro: channel,
            priority: 50
        }
    ]
};
