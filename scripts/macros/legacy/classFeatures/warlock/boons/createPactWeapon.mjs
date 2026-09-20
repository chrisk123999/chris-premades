import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, effectUtils, genericUtils, itemUtils} from '../../../../../proxy.mjs';
function bestAbility(actor, item, ability) {
    const activities = item.system.activities;
    const attack = activities.getByType ? activities.getByType('attack')[0] : Object.values(activities).find(activity => activity.type === 'attack');
    const weaponAbility = attack?.attack.ability || 'str';
    const abilities = [weaponAbility, ability];
    const properties = item.system.properties;
    if (properties.has ? properties.has('fin') : properties.includes('fin')) abilities.push('dex');
    return actorUtils.getBestAbility(actor, abilities) === ability ? ability : undefined;
}
async function pactEffect({document, workflow}) {
    await clearPactWeapon(workflow.actor);
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: _loc('CHRISPREMADES.Macros.Legacy.CreatePactWeapon.Weapon'),
        img: document.img,
        origin: document.uuid,
        identifier: 'pactWeapon',
        activityUuid: workflow.activity.uuid,
        unhideActivities: ['dismiss-pact-weapon']
    });
    return (await effectUtils.createEffects(workflow.actor, [effectData]))[0];
}
async function conjure({document, workflow, improved, hexWarrior}) {
    const baseWeapons = automationUtils.getConfigValue(document, 'weapons').concat(improved ? automationUtils.getConfigValue(document, 'rangedWeapons') : []);
    const documents = (await Promise.all(baseWeapons.map(async id => await fromUuid(CONFIG.DND5E.weaponIds[id])))).filter(item => item);
    if (!documents.length) return;
    const selection = await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.CreatePactWeapon.Select'), documents, {sort: 'alphabetical'});
    if (!selection) return;
    const weaponData = selection.toObject();
    delete weaponData._id;
    weaponData.name += ' (' + _loc('CHRISPREMADES.Macros.Legacy.CreatePactWeapon.Weapon') + ')';
    weaponData.system.proficient = true;
    weaponData.system.equipped = true;
    weaponData.system.properties.push('mgc');
    if (improved) weaponData.system.magicalBonus = Math.max(1, weaponData.system.magicalBonus ?? 0);
    if (hexWarrior) {
        const ability = bestAbility(workflow.actor, weaponData, automationUtils.getConfigValue(hexWarrior, 'ability'));
        const attackActivityId = Object.entries(weaponData.system.activities).find(entry => entry[1].type === 'attack')?.[0];
        if (ability && attackActivityId) weaponData.system.activities[attackActivityId].attack.ability = ability;
    }
    genericUtils.setProperty(weaponData, 'system.identifier', 'pact-weapon');
    const effect = await pactEffect({document, workflow});
    await itemUtils.createItems(workflow.actor, [weaponData], {parentEntity: effect, favorite: true});
}
async function enchant({document, workflow, improved, hexWarrior, validWeapons}) {
    const weapon = validWeapons.length === 1 ? validWeapons[0] : await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.CreatePactWeapon.SelectWeapon'), validWeapons, {sort: 'alphabetical'});
    if (!weapon) return;
    const hexWeaponEffect = documentUtils.getEffectByIdentifier(weapon, 'hexWarriorWeapon');
    if (hexWeaponEffect) await documentUtils.deleteDocument(hexWeaponEffect);
    const effect = await pactEffect({document, workflow});
    const effectData = documentUtils.getBaseEffectData(workflow.activity, {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        identifier: 'pactWeapon',
        parentEntity: effect,
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + _loc('CHRISPREMADES.Macros.Legacy.CreatePactWeapon.Weapon') + ')',
                priority: 20
            }
        ]
    });
    if (improved) effectData.changes.push({
        key: 'system.magicalBonus',
        mode: 4,
        value: 1,
        priority: 20
    });
    if (hexWarrior) {
        const ability = bestAbility(workflow.actor, weapon, automationUtils.getConfigValue(hexWarrior, 'ability'));
        if (ability) effectData.changes.push({
            key: 'activities[attack].attack.ability',
            mode: 5,
            value: ability,
            priority: 20
        });
    }
    await itemUtils.enchantItem(weapon, effectData);
}
async function use({document, workflow}) {
    if (workflow.activity.identifier !== 'create-pact-weapon') return;
    const improved = actorUtils.getItemByIdentifier(workflow.actor, 'improved-pact-weapon');
    const hexWarrior = actorUtils.getItemByIdentifier(workflow.actor, 'hex-warrior');
    let validWeapons = workflow.actor.items.filter(item => item.type === 'weapon' && item.system.properties.has('mgc') && item.system.identifier !== 'pact-weapon');
    if (!improved) validWeapons = validWeapons.filter(item => constants.meleeWeaponOptions().some(option => option.value === item.system.type.baseItem));
    if (!validWeapons.length) return await conjure({document, workflow, improved, hexWarrior});
    const pactType = await dialogUtils.buttonDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.CreatePactWeapon.Type'), [
        [_loc('CHRISPREMADES.Macros.Legacy.CreatePactWeapon.Existing'), 'enchant'],
        [_loc('CHRISPREMADES.Macros.Legacy.CreatePactWeapon.Summon'), 'summon']
    ]);
    if (!pactType) return;
    if (pactType === 'summon') return await conjure({document, workflow, improved, hexWarrior});
    await enchant({document, workflow, improved, hexWarrior, validWeapons});
}
async function clearPactWeapon(actor) {
    const effect = documentUtils.getEffectByIdentifier(actor, 'pactWeapon');
    if (effect) await documentUtils.deleteDocument(effect);
}
async function dismiss({workflow}) {
    if (workflow.activity.identifier !== 'dismiss-pact-weapon') return;
    await clearPactWeapon(workflow.actor);
}
export const createPactWeapon = {
    name: 'Create Pact Weapon',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {pass: 'itemRollFinished', macro: use, priority: 50},
        {pass: 'itemRollFinished', macro: dismiss, priority: 50}
    ],
    config: {
        weapons: {
            default: ['battleaxe', 'club', 'dagger', 'flail', 'glaive', 'greataxe', 'greatclub', 'greatsword', 'halberd', 'handaxe', 'javelin', 'lance', 'lighthammer', 'longsword', 'mace', 'maul', 'morningstar', 'pike', 'quarterstaff', 'rapier', 'scimitar', 'shortsword', 'sickle', 'spear', 'trident', 'warpick', 'warhammer', 'whip'],
            type: 'select-many',
            label: 'CHRISPREMADES.Config.WeaponTypes',
            category: 'mechanics',
            get options() { return constants.meleeWeaponOptions(); }
        },
        rangedWeapons: {
            default: ['shortbow', 'longbow', 'lightcrossbow', 'heavycrossbow'],
            type: 'select-many',
            label: 'CHRISPREMADES.Macros.Legacy.CreatePactWeapon.RangedWeapons',
            category: 'mechanics',
            get options() { return constants.rangedWeaponOptions(); }
        }
    }
};
