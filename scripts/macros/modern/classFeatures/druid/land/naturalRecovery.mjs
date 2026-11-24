import {automationUtils, documentUtils} from '../../../../../proxy.mjs';
import {getLand, getLandItem} from './circleOfTheLandSpells.mjs';
const spells = {
    arid: ['blur', 'burning-hands', 'fireball', 'blight', 'wall-of-stone'],
    polar: ['fog-cloud', 'hold-person', 'sleet-storm', 'ice-storm', 'cone-of-cold'],
    temperate: ['misty-step', 'sleep', 'lightning-bolt', 'freedom-of-movement', 'tree-stride'],
    tropical: ['ray-of-sickness', 'web', 'stinking-cloud', 'polymorph', 'insect-plague']
};
function getCircleSpells(item, actor) {
    const configured = String(automationUtils.getConfigValue(item, 'spells') ?? '').split(',').map(identifier => identifier.trim()).filter(Boolean);
    if (configured.length) return configured;
    const landItem = getLandItem(actor);
    const granted = landItem ? actor.itemTypes.spell.filter(spell => spell.system.level > 0 && spell.getFlag('dnd5e', 'advancementOrigin')?.startsWith(landItem.id + '.')).map(spell => spell.system.identifier) : [];
    if (granted.length) return granted;
    const land = getLand(actor);
    if (!land) return Object.values(spells).flat();
    const known = (spells[land] ?? []).filter(identifier => actor.itemTypes.spell.some(spell => spell.system.identifier === identifier));
    return known.length ? known : spells[land] ?? [];
}
async function prepare({activity, actor}) {
    const path = 'flags.cat.genericConfig.chris-premades.specialItemUse.identifiers';
    if (!foundry.utils.hasProperty(activity, path)) return;
    const identifiers = getCircleSpells(activity.item, actor);
    if (foundry.utils.getProperty(activity, path)?.join() === identifiers.join()) return;
    await documentUtils.update(activity, {[path]: identifiers});
}
export const naturalRecovery = {
    name: 'Natural Recovery',
    version: '2.1.11',
    rules: '2024',
    roll: [
        {
            pass: 'itemPreTargeting',
            macro: prepare,
            priority: 50
        }
    ],
    config: {
        spells: {
            default: '',
            type: 'text',
            label: 'CHRISPREMADES.Macros.Modern.NaturalRecovery.Spells.Label',
            hint: 'CHRISPREMADES.Macros.Modern.NaturalRecovery.Spells.Hint',
            category: 'homebrew'
        }
    }
};
