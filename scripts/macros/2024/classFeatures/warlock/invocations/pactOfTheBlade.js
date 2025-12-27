import {actorUtils, constants, dialogUtils, effectUtils, genericUtils, itemUtils, workflowUtils} from '../../../../../utils.js';
async function bond({trigger, workflow}) {
    let validBaseWeapons = itemUtils.getConfig(workflow.item, 'weapons');
    let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.properties.has('mgc') && validBaseWeapons.includes(i.system.type.baseItem) && !itemUtils.getEffectByIdentifier(i, 'pactOfTheBladeBondedEnchantment'));
    if (!validWeapons.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.PactOfTheBlade.SelectBond', validWeapons, {sortAlphabetical: true});
    if (!selection) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    let pactOfTheBladeEnchantments = workflow.actor.items.filter(item => item.type === 'weapon' && itemUtils.getEffectByIdentifier(item, 'pactOfTheBladeBondedEnchantment'))?.map(item => itemUtils.getEffectByIdentifier(item, 'pactOfTheBladeBondedEnchantment'));
    if (pactOfTheBladeEnchantments.length) await Promise.all(pactOfTheBladeEnchantments.map(async effect => await genericUtils.remove(effect)));
    await itemUtils.enchantItem(selection, effectData, {identifier: 'pactOfTheBladeBondedEnchantment'});
}
async function conjure({trigger, workflow}) {
    let pactOfTheBladeEnchantment = workflow.actor.items.find(item => item.type === 'weapon' && itemUtils.getEffectByIdentifier(item, 'pactOfTheBladeBondedEnchantment'));
    if (pactOfTheBladeEnchantment) return;
    let validBaseWeapons = itemUtils.getConfig(workflow.item, 'weapons');
    let documents = (await Promise.all(validBaseWeapons.map(async name => {
        let uuid = CONFIG.DND5E.weaponIds[name];
        if (!uuid) return;
        return await fromUuid(uuid);
    }))).filter(i => i);
    if (!documents.length) return;
    let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.PactOfTheBlade.Conjure', documents, {sortAlphabetical: true});
    if (!selection) return;
    let sourceEffect = workflow.activity.effects[0]?.effect;
    if (!sourceEffect) return;
    let summonedWeaponEffect = effectUtils.getEffectByIdentifier(workflow.actor, 'pactOfTheBladeSummonedWeapon');
    if (summonedWeaponEffect) await genericUtils.remove(summonedWeaponEffect);
    let effectData = genericUtils.duplicate(sourceEffect.toObject());
    effectData.origin = sourceEffect.uuid;
    let effect = await effectUtils.createEffect(workflow.actor, effectData);
    let itemData = genericUtils.duplicate(selection.toObject());
    delete itemData._id;
    itemData.system.properties.push('mgc');
    itemData.system.equipped = true;
    itemData.system.proficient = 1;
    itemData.name += ' (' + genericUtils.translate('CHRISPREMADES.Macros.PactOfTheBlade.Name') + ')';
    effectUtils.addMacro(itemData, 'midi.item', ['pactOfTheBladeAttack']);
    genericUtils.setProperty(itemData, 'system.source.rules', '2024');
    await itemUtils.createItems(workflow.actor, [itemData], {favorite: true, section: workflow.item.name, parentEntity: effect});
}
async function early({trigger, workflow}) {
    if (!workflowUtils.isAttackType(workflow, 'attack')) return;
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'pactOfTheBlade');
    if (!feature) return;
    let ability = itemUtils.getConfig(feature, 'ability');
    let weaponAbility = workflow.activity.attack.ability ?? 'str';
    let abilities = [ability, weaponAbility];
    if (workflow.item.system.properties.has('fin')) abilities.push('dex');
    let bestAbility = actorUtils.getBestAbility(workflow.actor, abilities);
    if (bestAbility === weaponAbility) return;
    let activity = workflow.activity.clone({'attack.ability': ability}, {keepId: true});
    activity.prepareData();
    activity.prepareFinalData();
    workflow.activity = activity;
}
async function damage({trigger, workflow}) {
    let feature = itemUtils.getItemByIdentifier(workflow.actor, 'pactOfTheBlade');
    if (!feature) return;
    let damageTypes = itemUtils.getConfig(feature, 'damageTypes');
    if (!damageTypes.length) return;
    let damageType;
    if (damageTypes.length === 1) {
        damageType = damageTypes[0];
    } else {
        damageType = await dialogUtils.selectDamageType(damageTypes, feature.name, 'CHRISPREMADES.Macros.PactOfTheBlade.ReplaceDamage', {addNo: true});
        if (!damageType) return;
    }
    workflow.damageRolls.forEach(roll => roll.options.type = damageType);
    await workflow.setDamageRolls(workflow.damageRolls);
}
export let pactOfTheBlade = {
    name: 'Eldritch Invocations: Pact of the Blade',
    version: '1.3.148',
    rules: 'modern',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: bond,
                priority: 50,
                activities: ['bond']
            },
            {
                pass: 'rollFinished',
                macro: conjure,
                priority: 50,
                activities: ['conjure']
            }
        ]
    },
    config: [
        {
            value: 'weapons',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            type: 'select-many',
            default: ['battleaxe', 'club', 'dagger', 'flail', 'glaive', 'greataxe', 'greatclub', 'greatsword', 'halberd', 'handaxe', 'javelin', 'lance', 'lighthammer', 'longsword', 'mace', 'maul', 'morningstar', 'pike', 'quarterstaff', 'rapier', 'scimitar', 'shortsword', 'sickle', 'spear', 'trident', 'warpick', 'warhammer', 'whip'],
            category: 'mechanics',
            options: constants.getBaseWeaponOptions
        },
        {
            value: 'ability',
            label: 'CHRISPREMADES.Config.Ability',
            type: 'select',
            default: 'cha',
            options: constants.abilityOptions,
            category: 'homebrew',
            homebrew: true
        },
        {
            value: 'damageTypes',
            label: 'CHRISPREMADES.Config.DamageTypes',
            type: 'select-many',
            default: ['necrotic', 'psychic', 'radiant'],
            options: constants.damageTypeOptions,
            category: 'homebrew',
            homebrew: true
        }
    ]
};
export let pactOfTheBladeAttack = {
    name: 'Pact of the Blade: Attack',
    version: pactOfTheBlade.version,
    rules: pactOfTheBlade.rules,
    midi: {
        item: [
            {
                pass: 'preambleComplete',
                macro: early,
                priority: 25
            },
            {
                pass: 'damageRollComplete',
                macro: damage,
                priority: 25
            }
        ]
    }
};