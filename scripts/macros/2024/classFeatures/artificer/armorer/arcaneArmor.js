import {dialogUtils, genericUtils, itemUtils} from '../../../../../utils.js';
async function select({trigger, workflow}) {
    let allArmor = workflow.actor.items.filter(i => i.type === 'equipment' && ['heavy', 'medium', 'light'].includes(i.system.type?.value));
    if (!allArmor.length) return;
    let armorUuid = workflow.item.flags['chris-premades']?.arcaneArmor?.uuid;
    let armor;
    if (armorUuid) armor = await fromUuid(armorUuid);
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.ArcaneArmor.Select', allArmor, {sortAlphabetical: true});
    if (!selection) return;
    if (armor) {
        let enchantment = itemUtils.getEffectByIdentifier(armor, 'arcaneArmorEffect');
        if (enchantment) await genericUtils.remove(enchantment);
    }
    await genericUtils.setFlag(workflow.item, 'chris-premades', 'arcaneArmor.uuid', selection.uuid);
    let effect = itemUtils.getEffectByIdentifier(workflow.item, 'arcaneArmorEffect');
    if (!effect) return;
    let effectData = effect.toObject();
    delete effectData._id;
    effectData.origin = effect.uuid;
    effectData.changes.push({
        key: 'name',
        mode: 5,
        value: '{} (' + workflow.item.name + ')',
        priority: 50
    });
    await itemUtils.enchantItem(selection, effectData);
}
async function donDoff({trigger, workflow}) {
    let armorUuid = workflow.item.flags['chris-premades']?.arcaneArmor?.uuid;
    if (!armorUuid) return;
    let armor = await fromUuid(armorUuid);
    if (!armor) return;
    genericUtils.update(armor, {'system.equipped': !armor.system.equipped});
}
export let arcaneArmor = {
    name: 'Arcane Armor',
    version: '1.5.32',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: select,
                priority: 50,
                activities: ['select']
            },
            {
                pass: 'rollFinished',
                macro: donDoff,
                priority: 50,
                activities: ['donDoff']
            }
        ]
    }
};