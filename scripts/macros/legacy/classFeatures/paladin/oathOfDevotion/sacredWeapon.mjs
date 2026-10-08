import {actorUtils, dialogUtils, effectUtils, itemUtils} from '../../../../../proxy.mjs';
async function use({workflow}) {
    const weapons = actorUtils.getEquippedWeapons(workflow.actor);
    if (!weapons.length) return;
    const weapon = weapons.length === 1 ? weapons[0] : await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.Legacy.SacredWeapon.Select', weapons, {sort: 'alphabetical'});
    if (!weapon) return;
    const enchantment = workflow.item.effects.find(effect => effect.type === 'enchantment');
    const effectData = enchantment.toObject();
    delete effectData._id;
    effectData.origin = workflow.item.uuid;
    const [applied] = await itemUtils.enchantItem(weapon, effectData) ?? [];
    if (!applied) return;
    const lights = workflow.item.effects.filter(effect => effect.type !== 'enchantment').map(effect => {
        const lightData = effect.toObject();
        delete lightData._id;
        lightData.transfer = true;
        lightData.origin = workflow.item.uuid;
        lightData.flags.dnd5e = {...lightData.flags.dnd5e, dependentOn: applied.id};
        return lightData;
    });
    if (lights.length) await effectUtils.createEffects(weapon, lights);
}
export const sacredWeapon = {
    name: 'Channel Divinity: Sacred Weapon',
    version: '2.0.4',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ]
};
