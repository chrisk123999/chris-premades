import {activityUtils, compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../../../../utils.js';

async function use({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'pactWeapon');
    if (effect) await genericUtils.remove(effect);
    let improvedPactWeapon = itemUtils.getItemByIdentifier(workflow.actor, 'improvedPactWeapon');
    let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.properties.has('mgc'));
    if (!improvedPactWeapon) validWeapons = validWeapons.filter(i => constants.meleeWeaponTypes.includes(i.system.type.value));
    let pactType;
    if (!validWeapons.length) {
        pactType = 'summon';
    } else {
        pactType = await dialogUtils.buttonDialog(workflow.item.name, 'CHRISPREMADES.Macros.CreatePactWeapon.Type', [
            ['CHRISPREMADES.Macros.CreatePactWeapon.Existing', 'enchant'],
            ['CHRISPREMADES.Macros.CreatePactWeapon.Summon', 'summon']
        ]);
        if (!pactType) return;
    }
    if (pactType === 'summon') {
        let packKey = itemUtils.getConfig(workflow.item, 'compendium');
        let customPack = !!packKey?.length;
        if (!customPack) packKey = genericUtils.getCPRSetting('itemCompendium');
        let documents;
        let pack = game.packs.get(packKey);
        if (!pack) return;
        let inputs = {
            types: ['weapon'],
            typeValues: constants.meleeWeaponTypes,
            badProperties: ['mgc']
        };
        documents = await compendiumUtils.getFilteredItemDocumentsFromCompendium(packKey, customPack ? {} : inputs);
        if (!customPack && improvedPactWeapon) {
            let rangedDocs = await compendiumUtils.getFilteredItemDocumentsFromCompendium(packKey, {specificNames: ['Shortbow', 'Longbow', 'Crossbow, light', 'Crossbow, heavy', 'Light Crossbow', 'Heavy Crossbow'], types: ['weapon']});
            documents.push(...rangedDocs);
        }
        let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.CreatePactWeapon.Select', documents, {sortAlphabetical: true});
        if (!selection) return;
        let weaponData = selection.toObject();
        weaponData.name += ' (' + genericUtils.translate('CHRISPREMADES.Macros.CreatePactWeapon.Weapon') + ')';
        weaponData.system.proficient = true;
        weaponData.system.properties.push('mgc');
        let hexWarrior = itemUtils.getItemByIdentifier(workflow.actor, 'hexWarrior');
        if (hexWarrior) {
            let cha = workflow.actor.system.abilities.cha.mod;
            let attackActivityId = Object.entries(weaponData.system.activities).find(i => i[1].type === 'attack')?.[0];
            if (!attackActivityId) return; // Should never happen, only with bad weapon data (no attack activity)
            let ability = weaponData.system.activities[attackActivityId].attack.ability;
            if (!ability?.length) ability = 'str';
            let score = workflow.actor.system.abilities[ability].mod;
            let dex = workflow.actor.system.abilities.dex.mod;
            let changed = false;
            let isFin = weaponData.system.properties.includes('fin');
            if (isFin) {
                let mod = Math.max(dex, score);
                if (mod <= cha) {
                    ability = 'cha';
                    changed = true;
                }
            } else {
                if (score <= cha) {
                    ability = 'cha';
                    changed = true;
                }
            }
            if (changed) weaponData.system.activities[attackActivityId].attack.ability = ability;
        }
        if (improvedPactWeapon) {
            weaponData.system.magicalBonus = Math.max(1, weaponData.system.magicalBonus ?? 0);
        }
        weaponData.system.equipped = true;
        genericUtils.setProperty(weaponData, 'flags.chris-premades.info.identifier', 'pactWeapon');
        let feature = activityUtils.getActivityByIdentifier(workflow.item, 'dismissPactWeapon', {strict: true});
        if (!feature) return;
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.Macros.CreatePactWeapon.Weapon'),
            img: workflow.item.img,
            origin: workflow.item.uuid
        };
        effect = await effectUtils.createEffect(workflow.actor, effectData, {
            identifier: 'pactWeapon',
            unhideActivities: {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['dismissPactWeapon'],
                favorite: true
            }
        });
        await itemUtils.createItems(workflow.actor, [weaponData], {parentEntity: effect, favorite: true});
    } else {
        let weapon = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.ElementalWeapon.SelectWeapon', validWeapons);
        if (!weapon) return;
        let enchantData = {
            name: workflow.item.name,
            img: workflow.item.img,
            origin: workflow.item.uuid,
            changes: [
                {
                    key: 'name',
                    mode: 5,
                    value: '{} (' + genericUtils.translate('CHRISPREMADES.Macros.CreatePactWeapon.Weapon') + ')',
                    priority: 20
                }
            ]
        };
        if (improvedPactWeapon) enchantData.changes.push({
            key: 'system.magicalBonus',
            mode: 4,
            value: 1,
            priority: 20
        });
        let hexWarrior = itemUtils.getItemByIdentifier(workflow.actor, 'hexWarrior');
        if (hexWarrior) {
            let cha = workflow.actor.system.abilities.cha.mod;
            let ability = weapon.system.activities.getByType('attack')[0]?.attack.ability;
            if (!ability?.length) ability = 'str';
            let score = workflow.actor.system.abilities[ability].mod;
            let dex = workflow.actor.system.abilities.dex.mod;
            let changed = false;
            let isFin = weapon.system.properties.has('fin');
            if (isFin) {
                let mod = Math.max(dex, score);
                if (mod <= cha) {
                    ability = 'cha';
                    changed = true;
                }
            } else {
                if (score <= cha) {
                    ability = 'cha';
                    changed = true;
                }
            }
            if (changed) enchantData.changes.push({
                key: 'activities[attack].attack.ability',
                mode: 5,
                value: ability,
                priority: 20
            });
        }
        let feature = activityUtils.getActivityByIdentifier(workflow.item, 'dismissPactWeapon', {strict: true});
        if (!feature) return;
        let hexWeaponEffect = Array.from(weapon.allApplicableEffects()).find(i => genericUtils.getIdentifier(i) === 'hexWarriorWeapon');
        if (hexWeaponEffect) await genericUtils.remove(hexWeaponEffect);
        let effectData = {
            name: genericUtils.translate('CHRISPREMADES.Macros.CreatePactWeapon.Weapon'),
            img: workflow.item.img,
            origin: workflow.item.uuid
        };
        effect = await effectUtils.createEffect(workflow.actor, effectData, {
            identifier: 'pactWeapon',
            unhideActivities: {
                itemUuid: workflow.item.uuid,
                activityIdentifiers: ['dismissPactWeapon'],
                favorite: true
            }
        });
        await itemUtils.enchantItem(weapon, enchantData, {parentEntity: effect, interdependent: true, identifier: 'pactWeapon'});
    }
}
async function dismiss({workflow}) {
    let effect = effectUtils.getEffectByIdentifier(workflow.actor, 'pactWeapon');
    if (effect) await genericUtils.remove(effect);
}
export let createPactWeapon = {
    name: 'Create Pact Weapon',
    version: '1.1.0',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50,
                activities: ['createPactWeapon']
            },
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50,
                activities: ['dismissPactWeapon']
            }
        ]
    },
    config: [
        {
            value: 'compendium',
            label: 'CHRISPREMADES.Macros.CreatePactWeapon.CustomCompendium',
            type: 'select',
            options: constants.itemCompendiumPacks,
            default: '',
            category: 'mechanics'
        },
    ]
};