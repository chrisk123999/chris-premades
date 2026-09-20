import {actorUtils, automationUtils, constants, dialogUtils, documentUtils, genericUtils, itemUtils} from '../../../../../proxy.mjs';
async function use({document, workflow}) {
    const weapons = workflow.actor.items.filter(item => item.type === 'weapon' && !item.system.properties.has('two'));
    const existing = weapons.map(item => documentUtils.getEffectByIdentifier(item, 'hexWarriorWeapon')).find(effect => effect);
    if (existing) await documentUtils.deleteDocument(existing);
    const validWeapons = weapons.filter(item => item.system.equipped && !documentUtils.getEffectByIdentifier(item, 'pactWeapon'));
    if (!validWeapons.length) {
        genericUtils.notify('CHRISPREMADES.Macros.Legacy.HexWarrior.NoWeapons', {type: 'info'});
        return;
    }
    let selection = validWeapons[0];
    if (validWeapons.length > 1) {
        selection = await dialogUtils.selectDocumentDialog(document.name, _loc('CHRISPREMADES.Macros.Legacy.HexWarrior.SelectWeapon'), validWeapons, {sort: 'alphabetical'});
        if (!selection) return;
    }
    const effectData = {
        name: document.name,
        img: document.img,
        origin: document.uuid,
        changes: [
            {
                key: 'name',
                mode: 5,
                value: '{} (' + document.name + ')',
                priority: 20
            }
        ]
    };
    genericUtils.setProperty(effectData, 'flags.cat.identifier', 'hexWarriorWeapon');
    const ability = automationUtils.getConfigValue(document, 'ability');
    const weaponAbility = selection.system.activities.getByType('attack')[0]?.attack.ability || 'str';
    const abilities = [weaponAbility, ability];
    if (selection.system.properties.has('fin')) abilities.push('dex');
    if (actorUtils.getBestAbility(workflow.actor, abilities) === ability) effectData.changes.push({
        key: 'activities[attack].attack.ability',
        mode: 5,
        value: ability,
        priority: 20
    });
    await itemUtils.enchantItem(selection, effectData);
}
export const hexWarrior = {
    name: 'Hex Warrior',
    version: '2.0.0',
    rules: '2014',
    roll: [
        {
            pass: 'itemRollFinished',
            macro: use,
            priority: 50
        }
    ],
    config: {
        ability: {
            default: 'cha',
            type: 'select',
            label: 'CHRISPREMADES.Config.Ability',
            category: 'homebrew',
            get options() { return constants.abilityOptions(); }
        }
    }
};
