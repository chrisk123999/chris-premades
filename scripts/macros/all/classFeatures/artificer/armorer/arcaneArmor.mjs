import {actorUtils, dataUtils, dialogUtils, documentUtils, itemUtils} from '../../../../../proxy.mjs';
const bodyArmor = ['light', 'medium', 'heavy'];
function getEnchantment(armor) {
    return armor?.effects.find(effect => documentUtils.getIdentifier(effect) === 'arcaneArmorEnchantment');
}
function getArmor(actor) {
    return actor.items.find(item => item.type === 'equipment' && getEnchantment(item));
}
export function isWearingArcaneArmor(actor) {
    return !!getArmor(actor)?.system.equipped;
}
async function refreshModel(actor) {
    const disabled = !isWearingArcaneArmor(actor);
    const effects = actorUtils.getEffects(actor).filter(effect => effect.flags['chris-premades']?.armorModel && effect.disabled !== disabled);
    await Promise.all(effects.map(effect => documentUtils.update(effect, {disabled})));
}
async function select({document: item, workflow}) {
    const armors = workflow.actor.items.filter(armor => armor.type === 'equipment' && armor.system.equipped && bodyArmor.includes(armor.system.type?.value));
    if (!armors.length) return;
    const selection = armors.length === 1 ? armors[0] : await dialogUtils.selectDocumentDialog(item.name, 'CHRISPREMADES.Macros.All.ArcaneArmor.Select', armors, {sort: 'alphabetical'});
    if (!selection) return;
    const previous = getEnchantment(getArmor(workflow.actor));
    if (previous) await documentUtils.deleteDocument(previous);
    const source = item.effects.find(effect => documentUtils.getIdentifier(effect) === 'arcaneArmorEnchantment');
    if (!source) return;
    const effectData = source.toObject();
    delete effectData._id;
    dataUtils.setOrigin(effectData, item);
    await itemUtils.enchantItem(selection, effectData);
    await refreshModel(workflow.actor);
}
async function donDoff({workflow}) {
    const armor = getArmor(workflow.actor);
    if (armor) await documentUtils.update(armor, {'system.equipped': !armor.system.equipped});
}
async function use({document: item, workflow}) {
    if (workflow.activity.identifier === 'select') return await select({document: item, workflow});
    if (workflow.activity.identifier === 'don-doff') return await donDoff({workflow});
}
async function equipped({actor, item}) {
    if (item.type !== 'equipment' || !bodyArmor.includes(item.system.type?.value)) return;
    const armor = getArmor(actor);
    if (armor && armor !== item) await documentUtils.deleteDocument(getEnchantment(armor));
    await refreshModel(actor);
}
async function unequipped({actor, item}) {
    if (item !== getArmor(actor)) return;
    await refreshModel(actor);
    const field = actorUtils.getEffectByIdentifier(actor, 'defensiveField');
    if (!field) return;
    const temp = actor.system.attributes.hp.temp ?? 0;
    await documentUtils.deleteDocument(field);
    if (temp && temp <= (field.flags['chris-premades']?.defensiveField ?? 0)) await documentUtils.update(actor, {'system.attributes.hp.temp': 0});
}
export const arcaneArmor = {
    name: 'Arcane Armor',
    version: '2.1.11',
    rules: 'all',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    item: [
        {
            pass: 'actorEquipped',
            macro: equipped,
            priority: 50
        },
        {
            pass: 'actorUnequipped',
            macro: unequipped,
            priority: 50
        }
    ]
};
