import {compendiumUtils, constants, dialogUtils, effectUtils, errors, genericUtils, itemUtils} from '../../../../../utils.js';

async function use({workflow}) {
    let currItem = itemUtils.getItemByIdentifier(workflow.actor, 'pactWeapon');
    if (currItem) await dismiss({workflow});
    let improvedPactWeapon = itemUtils.getItemByIdentifier(workflow.actor, 'improvedPactWeapon');
    let validWeapons = workflow.actor.items.filter(i => i.type === 'weapon' && i.system.properties.has('mgc'));
    if (!improvedPactWeapon) validWeapons = validWeapons.filter(i => i.system.actionType === 'mwak');
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
        let weapons = [
            'Club',
            'Dagger',
            'Greatclub',
            'Handaxe',
            'Javelin',
            'Light Hammer',
            'Mace',
            'Quarterstaff',
            'Sickle',
            'Spear',
            'Battleaxe',
            'Flail',
            'Glaive',
            'Greataxe',
            'Greatsword',
            'Halberd',
            'Lance',
            'Longsword',
            'Maul',
            'Morningstar',
            'Pike',
            'Rapier',
            'Scimitar',
            'Shortsword',
            'Trident',
            'War Pick',
            'Warhammer',
            'Whip'
        ];
        if (improvedPactWeapon) {
            weapons.push('Shortbow', 'Longbow', 'Crossbow, light', 'Crossbow, heavy', 'Light Crossbow', 'Heavy Crossbow');
        }
        let documents;
        let pack = game.packs.get(packKey);
        if (!pack) return;
        documents = await compendiumUtils.getFilteredItemDocumentsFromCompendium(packKey, {specificNames: customPack ? [] : weapons, types: ['weapon']});
        let selection = await dialogUtils.selectDocumentDialog(workflow.item.name, 'CHRISPREMADES.Macros.CreatePactWeapon.Select', documents, {sortAlphabetical: true});
        if (!selection) return;
        let weaponData = selection.toObject();
        weaponData.name += ' (' + genericUtils.translate('CHRISPREMADES.Macros.CreatePactWeapon.Weapon') + ')';
        weaponData.system.proficient = true;
        weaponData.system.properties.push('mgc');
        let hexWarrior = itemUtils.getItemByIdentifier(workflow.actor, 'hexWarrior');
        if (hexWarrior) {
            let cha = workflow.actor.system.abilities.cha.mod;
            let ability = weaponData.system.ability;
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
            if (changed) weaponData.system.ability = ability;
        }
        if (improvedPactWeapon) {
            weaponData.system.magicalBonus = Math.max(1, weaponData.system.magicalBonus ?? 0);
        }
        weaponData.system.equipped = true;
        genericUtils.setProperty(weaponData, 'flags.chris-premades.info.identifier', 'pactWeapon');
        let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Dismiss Pact Weapon', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.CreatePactWeapon.Dismiss', identifier: 'dismissPactWeapon'});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
        let [pactWeapon, dismissItem] = await itemUtils.createItems(workflow.actor, [weaponData, featureData], {favorite: true});
        await effectUtils.addDependent(pactWeapon, [dismissItem]);
        await effectUtils.addDependent(dismissItem, [pactWeapon]);
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
            let ability = weapon.system.ability;
            if (!ability?.length) ability = 'str';
            let score = workflow.actor.system.abilities[ability].mod;
            let dex = workflow.actor.system.abilities.dex.mod;
            let changed = false;
            let isFin = weapon.system.properties.includes('fin');
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
                key: 'system.ability',
                mode: 5,
                value: ability,
                priority: 20
            });
        }
        let featureData = await compendiumUtils.getItemFromCompendium(constants.featurePacks.classFeatureItems, 'Dismiss Pact Weapon', {object: true, getDescription: true, translate: 'CHRISPREMADES.Macros.CreatePactWeapon.Dismiss', identifier: 'dismissPactWeapon'});
        if (!featureData) {
            errors.missingPackItem();
            return;
        }
        let [dismissItem] = await itemUtils.createItems(workflow.actor, [featureData], {favorite: true});
        await itemUtils.enchantItem(weapon, enchantData, {parentEntity: dismissItem, interdependent: true, identifier: 'pactWeapon'});
    }
}
async function dismiss({workflow}) {
    await genericUtils.remove(workflow.item);
}
export let createPactWeapon = {
    name: 'Create Pact Weapon',
    version: '0.12.54',
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: use,
                priority: 50
            }
        ]
    },
    config: [
        {
            value: 'compendium',
            label: 'CHRISPREMADES.Macros.CreatePactWeapon.CustomCompendium',
            type: 'text',
            default: '',
            category: 'mechanics'
        },
    ]
};
export let createPactWeaponDismiss = {
    name: 'Create Pact Weapon: Dismiss',
    version: createPactWeapon.version,
    midi: {
        item: [
            {
                pass: 'rollFinished',
                macro: dismiss,
                priority: 50
            }
        ]
    }
};