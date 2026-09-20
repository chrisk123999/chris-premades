import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils} from '../../../../../proxy.mjs';
const bondIdentifier = 'pactOfTheBladeBondedEnchantment';
function bondData(document, workflow, weapon) {
    const ability = automationUtils.getConfigValue(document, 'ability');
    const changes = [
        {
            key: 'name',
            mode: 5,
            value: '{} (' + _loc('CHRISPREMADES.Macros.Modern.PactOfTheBlade.Name') + ')',
            priority: 20
        }
    ];
    const weaponAbility = weapon.system.activities?.getByType?.('attack')[0]?.attack.ability || 'str';
    const abilities = [weaponAbility, ability];
    if (weapon.system.properties.has('fin')) abilities.push('dex');
    if (actorUtils.getBestAbility(workflow.actor, abilities) === ability) changes.push({
        key: 'activities[attack].attack.ability',
        mode: 5,
        value: ability,
        priority: 20
    });
    return documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: bondIdentifier,
        macros: [{type: 'roll', macros: [{source: 'chris-premades', rules: '2024', identifier: 'pact-of-the-blade-attack'}]}],
        changes
    });
}
async function clearBonds(actor) {
    for (const item of actor.itemTypes.weapon) {
        const effect = documentUtils.getEffectByIdentifier(item, bondIdentifier);
        if (effect) await documentUtils.deleteDocument(effect);
    }
    const summoned = documentUtils.getEffectByIdentifier(actor, 'pactOfTheBladeSummonedWeapon');
    if (summoned) await documentUtils.deleteDocument(summoned);
}
async function bond({document, workflow}) {
    if (workflow.activity.identifier !== 'bond') return;
    const baseWeapons = automationUtils.getConfigValue(document, 'weapons');
    const validWeapons = workflow.actor.itemTypes.weapon.filter(item => item.system.properties.has('mgc') && baseWeapons.includes(item.system.type.baseItem));
    if (!validWeapons.length) return;
    const selection = validWeapons.length === 1 ? validWeapons[0] : await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.Modern.PactOfTheBlade.SelectBond'), validWeapons, {sort: 'alphabetical'});
    if (!selection) return;
    await clearBonds(workflow.actor);
    await itemUtils.enchantItem(selection, bondData(document, workflow, selection));
}
async function conjure({document, workflow}) {
    if (workflow.activity.identifier !== 'conjure') return;
    const baseWeapons = automationUtils.getConfigValue(document, 'weapons');
    const documents = (await Promise.all(baseWeapons.map(async id => await fromUuid(CONFIG.DND5E.weaponIds[id])))).filter(item => item);
    if (!documents.length) return;
    const selection = await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.Modern.PactOfTheBlade.Conjure'), documents, {sort: 'alphabetical'});
    if (!selection) return;
    await clearBonds(workflow.actor);
    const markerEffectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'pactOfTheBladeSummonedWeapon'
    });
    const [markerEffect] = await effectUtils.createEffects(workflow.actor, [markerEffectData]);
    if (!markerEffect) return;
    const itemData = selection.toObject();
    delete itemData._id;
    itemData.system.properties.push('mgc');
    itemData.system.equipped = true;
    itemData.system.proficient = 1;
    genericUtils.setProperty(itemData, 'system.source.rules', '2024');
    const [weapon] = await itemUtils.createItems(workflow.actor, [itemData], {parentEntity: markerEffect, favorite: true});
    if (!weapon) return;
    await itemUtils.enchantItem(weapon, bondData(document, workflow, weapon));
}
async function damage({workflow}) {
    const feature = actorUtils.getItemByIdentifier(workflow.actor, 'pact-of-the-blade');
    if (!feature) return;
    const damageTypes = automationUtils.getConfigValue(feature, 'damageTypes');
    if (!damageTypes.length) return;
    let damageType = damageTypes[0];
    if (damageTypes.length > 1) {
        damageType = await dialogUtils.selectDamageType(damageTypes, feature.name, _loc('CHRISPREMADES.Macros.Modern.PactOfTheBlade.ReplaceDamage'), {addNo: true});
        if (!damageType) return;
    }
    const rolls = workflow.damageRolls;
    rolls.forEach(roll => roll.options.type = damageType);
    await workflow.setDamageRolls(rolls);
}
export const pactOfTheBlade = {
    name: 'Eldritch Invocations: Pact of the Blade',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'itemRollFinished', macro: bond, priority: 50},
        {pass: 'itemRollFinished', macro: conjure, priority: 50}
    ],
    config: {
        weapons: {
            default: ['battleaxe', 'club', 'dagger', 'flail', 'glaive', 'greataxe', 'greatclub', 'greatsword', 'halberd', 'handaxe', 'javelin', 'lance', 'lighthammer', 'longsword', 'mace', 'maul', 'morningstar', 'pike', 'quarterstaff', 'rapier', 'scimitar', 'shortsword', 'sickle', 'spear', 'trident', 'warpick', 'warhammer', 'whip'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            category: 'mechanics',
            get options() { return constants.weaponOptions(); }
        },
        ability: {
            default: 'cha',
            type: 'select',
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew',
            get options() { return constants.abilityOptions(); }
        },
        damageTypes: {
            default: ['necrotic', 'psychic', 'radiant'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.DamageTypes',
            category: 'homebrew',
            get options() { return constants.damageTypeOptions(); }
        }
    }
};
export const pactOfTheBladeAttack = {
    name: 'Pact of the Blade: Attack',
    version: '2.0.0',
    rules: '2024',
    roll: [
        {pass: 'enchantmentDamageRollComplete', macro: damage, priority: 25}
    ]
};
