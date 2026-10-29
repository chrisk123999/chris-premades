import {automationUtils, dialogUtils, documentUtils, genericUtils, itemUtils} from '../../../proxy.mjs';
function isSharp(item) {
    const types = item.system.damage?.base?.types;
    if (types?.size) return ['piercing', 'slashing'].some(type => types.has(type));
    return item.type === 'consumable' && item.system.type?.subtype !== 'slingBullet';
}
function isCandidate(item, meleeOnly) {
    if (item.system.properties?.has('mgc')) return false;
    if (item.type === 'weapon') return item.system.equipped && (!meleeOnly || item.system.type?.value?.endsWith('M')) && isSharp(item);
    return item.type === 'consumable' && item.system.type?.value === 'ammo' && item.system.quantity && isSharp(item);
}
async function use({document: item, workflow}) {
    const actor = (workflow.targets.first() ?? workflow.token)?.actor ?? workflow.actor;
    const config = automationUtils.getConfigValues(item, configKeys);
    const candidates = actor.items.filter(candidate => isCandidate(candidate, config.meleeOnly));
    if (!candidates.length) {
        genericUtils.notify('CHRISPREMADES.Macros.All.OilOfSharpness.NoWeapons');
        return;
    }
    let target = await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.All.OilOfSharpness.Select', candidates);
    if (!target) return;
    if (target.type === 'consumable' && target.system.quantity > config.ammunition) {
        await documentUtils.update(target, {'system.quantity': target.system.quantity - config.ammunition});
        const ammunitionData = target.toObject();
        delete ammunitionData._id;
        ammunitionData.system.quantity = config.ammunition;
        [target] = await itemUtils.createItems(actor, [ammunitionData]);
    }
    const sourceEffect = item.effects.find(effect => effect.type === 'enchantment');
    const effectData = documentUtils.getEffectData(item, sourceEffect.id);
    await itemUtils.enchantItem(target, effectData);
}
export const oilOfSharpness = {
    name: 'Oil of Sharpness',
    version: '2.1.5',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        ammunition: {
            default: 5,
            type: 'number',
            label: 'CHRISPREMADES.Macros.All.OilOfSharpness.Ammunition',
            category: 'homebrew'
        },
        meleeOnly: {
            default: false,
            type: 'checkbox',
            label: 'CHRISPREMADES.Macros.All.OilOfSharpness.MeleeOnly',
            category: 'homebrew'
        }
    }
};
const configKeys = Object.keys(oilOfSharpness.config);
